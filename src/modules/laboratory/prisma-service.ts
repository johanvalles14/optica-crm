import type { Prisma } from '@prisma/client';
import type { ActorContext } from '../../../contracts/auth.contract';
import type {
  AssignLabDestinationInput,
  CreateLabOrderInput,
  EyeLabData,
  ILaboratoryService,
  LabOrder,
  LabOrderStatus,
  ReportReworkInput,
  TraySlipData,
} from '../../../contracts/laboratory.contract';
import { prisma } from '../../lib/prisma';
import { authorize } from '../auth/rbac';
import { AuditService } from '../audit/service';
import { LabStateMachine } from './state-machine';
import { formatTraySlip } from './tray-slip.service';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function stringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function eyeData(value: Prisma.JsonValue): EyeLabData {
  return value as EyeLabData;
}

type LabRecord = Prisma.LabOrderGetPayload<{}>;

function mapOrder(record: LabRecord): LabOrder {
  return {
    id: record.id,
    folio: record.folio,
    saleOrderId: record.saleOrderId,
    saleOrderFolio: record.saleOrderFolio,
    branchId: record.branchId,
    patientName: record.patientName,
    destination: record.destination as LabOrder['destination'],
    externalLabName: record.externalLabName ?? undefined,
    externalGuideNumber: record.externalGuideNumber ?? undefined,
    expectedReturnDate: record.expectedReturnDate ?? undefined,
    status: record.status as LabOrderStatus,
    frameCode: record.frameCode,
    frameDescription: record.frameDescription ?? undefined,
    frameMountingType: record.frameMountingType as LabOrder['frameMountingType'],
    lensMaterial: record.lensMaterial,
    treatments: stringArray(record.treatments),
    rightEye: eyeData(record.rightEye),
    leftEye: eyeData(record.leftEye),
    observations: record.observations ?? undefined,
    assignedTechnicianId: record.assignedTechnicianId ?? undefined,
    qualityApprovedAt: record.qualityApprovedAt ?? undefined,
    qualityApprovedBy: record.qualityApprovedBy ?? undefined,
    reworkReason: record.reworkReason ?? undefined,
    version: record.version,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class PrismaLaboratoryService implements ILaboratoryService {
  private readonly audit = new AuditService();
  private readonly stateMachine = new LabStateMachine();

  private async branch(branchId: string) {
    const key = branchId === 'branch-001' ? 'PT' : branchId;
    return prisma.branch.findFirstOrThrow({
      where: isUuid(key) ? { OR: [{ id: key }, { code: key }] } : { code: key },
    });
  }

  private async find(id: string) {
    return prisma.labOrder.findUnique({ where: { id } });
  }

  async createOrder(input: CreateLabOrderInput, actor: ActorContext): Promise<LabOrder> {
    if (!authorize(actor.role, 'create', 'LabOrder')) throw new Error('Permission denied');
    if (!input.saleOrderId || !input.saleOrderFolio || !input.patientName || !input.frameCode || !input.lensMaterial) {
      throw new Error('Datos incompletos para crear la orden de laboratorio');
    }

    const branch = await this.branch(input.branchId);
    const order = await prisma.$transaction(async (transaction) => {
      const sale = await transaction.saleOrder.findUnique({ where: { id: input.saleOrderId } });
      if (!sale) throw new Error('Orden de venta no encontrada');
      const updatedBranch = await transaction.branch.update({
        where: { id: branch.id },
        data: { nextLabSequence: { increment: 1 } },
      });
      const now = new Date();
      return transaction.labOrder.create({
        data: {
          folio: `LAB-${String(updatedBranch.nextLabSequence - 1).padStart(4, '0')}`,
          saleOrderId: sale.id,
          saleOrderFolio: input.saleOrderFolio,
          branchId: branch.id,
          patientName: input.patientName,
          destination: input.destination ?? 'internal_workshop',
          expectedReturnDate: input.expectedReturnDate,
          status: 'queued',
          frameCode: input.frameCode,
          frameDescription: input.frameDescription,
          frameMountingType: input.frameMountingType ?? 'full_rim',
          lensMaterial: input.lensMaterial,
          treatments: toJson(input.treatments ?? []),
          rightEye: toJson(input.rightEye),
          leftEye: toJson(input.leftEye),
          observations: input.observations,
          createdAt: now,
          updatedAt: now,
        },
      });
    });
    const result = mapOrder(order);
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'create', entity: 'LabOrder', entityId: result.id, requestId: actor.requestId, metadata: { folio: result.folio } });
    return result;
  }

  async assignDestination(input: AssignLabDestinationInput, actor: ActorContext): Promise<LabOrder> {
    if (!authorize(actor.role, 'update', 'LabOrder')) throw new Error('Permission denied');
    const current = await this.find(input.labOrderId);
    if (!current) throw new Error('Orden de laboratorio no encontrada');
    const result = await prisma.labOrder.updateMany({
      where: { id: input.labOrderId, version: input.expectedVersion },
      data: {
        destination: input.destination,
        externalLabName: input.externalLabName,
        externalGuideNumber: input.externalGuideNumber,
        expectedReturnDate: input.expectedReturnDate,
        status: input.destination === 'external_lab' ? 'in_process' : current.status,
        version: { increment: 1 },
      },
    });
    if (result.count !== 1) throw new Error('Stale version: expectedVersion does not match');
    return mapOrder((await this.find(input.labOrderId))!);
  }

  async updateStatus(labOrderId: string, newStatus: LabOrderStatus, expectedVersion: number, actor: ActorContext): Promise<LabOrder> {
    if (!authorize(actor.role, 'update', 'LabOrder')) throw new Error('Permission denied');
    const current = await this.find(labOrderId);
    if (!current) throw new Error('Orden de laboratorio no encontrada');
    const actions: Partial<Record<LabOrderStatus, Parameters<LabStateMachine['transition']>[1]>> = {
      in_process: 'start_process', quality_control: 'send_qc', completed: 'approve', rework_needed: 'restart', cancelled: 'cancel',
    };
    const action = actions[newStatus];
    if (!action || this.stateMachine.transition(current.status as LabOrderStatus, action) !== newStatus) throw new Error(`Invalid transition to ${newStatus}`);
    const result = await prisma.labOrder.updateMany({ where: { id: labOrderId, version: expectedVersion }, data: { status: newStatus, version: { increment: 1 } } });
    if (result.count !== 1) throw new Error('Stale version: expectedVersion does not match');
    return mapOrder((await this.find(labOrderId))!);
  }

  async approveQuality(labOrderId: string, expectedVersion: number, actor: ActorContext): Promise<LabOrder> {
    if (!authorize(actor.role, 'approveQuality', 'LabOrder')) throw new Error('Permission denied');
    const current = await this.find(labOrderId);
    if (!current) throw new Error('Orden de laboratorio no encontrada');
    const status = current.status === 'queued' ? 'completed' : this.stateMachine.transition(current.status as LabOrderStatus, 'approve');
    const result = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.labOrder.updateMany({ where: { id: labOrderId, version: expectedVersion }, data: { status, qualityApprovedAt: new Date(), qualityApprovedBy: actor.actorId, version: { increment: 1 } } });
      if (updated.count !== 1) throw new Error('Stale version: expectedVersion does not match');
      await transaction.saleOrder.updateMany({ where: { id: current.saleOrderId, status: 'confirmed_in_process' }, data: { status: 'ready_for_delivery' } });
      return transaction.labOrder.findUniqueOrThrow({ where: { id: labOrderId } });
    });
    const mapped = mapOrder(result);
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'update', entity: 'LabOrder', entityId: mapped.id, requestId: actor.requestId, metadata: { action: 'approveQuality' } });
    return mapped;
  }

  async reportRework(input: ReportReworkInput, actor: ActorContext): Promise<LabOrder> {
    if (!authorize(actor.role, 'reportRework', 'LabOrder')) throw new Error('Permission denied');
    if (!input.reason.trim()) throw new Error('El motivo de repetición es obligatorio');
    const current = await this.find(input.labOrderId);
    if (!current) throw new Error('Orden de laboratorio no encontrada');
    if (this.stateMachine.transition(current.status as LabOrderStatus, 'report_damage') !== 'rework_needed') throw new Error(`Invalid transition report_damage from ${current.status}`);

    const result = await prisma.$transaction(async (transaction) => {
      if (input.brokenProductId && input.brokenQuantity && input.brokenQuantity > 0) {
        const product = await transaction.product.findUnique({ where: { id: input.brokenProductId } });
        if (!product || product.stock < input.brokenQuantity) throw new Error('Stock insuficiente');
        await transaction.product.update({ where: { id: product.id }, data: { stock: { decrement: input.brokenQuantity }, version: { increment: 1 } } });
        await transaction.inventoryMovement.create({ data: { productId: product.id, branchId: product.branchId, movementType: 'out', quantityChange: -input.brokenQuantity, previousStock: product.stock, newStock: product.stock - input.brokenQuantity, reason: 'damage_breakage', notes: `Merma de taller: ${input.reason}`, actorId: actor.actorId } });
      }
      const expectedReturnDate = current.expectedReturnDate && input.additionalDeliveryDays ? new Date(current.expectedReturnDate.getTime() + input.additionalDeliveryDays * 86400000) : current.expectedReturnDate;
      const sale = await transaction.saleOrder.findUnique({ where: { id: current.saleOrderId }, select: { notes: true } });
      if (sale) {
        await transaction.saleOrder.update({
          where: { id: current.saleOrderId },
          data: { notes: [sale.notes, `REPETICIÓN / MERMA: ${input.reason}`].filter(Boolean).join(' | ') },
        });
      }
      const updated = await transaction.labOrder.updateMany({ where: { id: input.labOrderId, version: input.expectedVersion }, data: { status: 'rework_needed', reworkReason: input.reason, expectedReturnDate, version: { increment: 1 } } });
      if (updated.count !== 1) throw new Error('Stale version: expectedVersion does not match');
      return transaction.labOrder.findUniqueOrThrow({ where: { id: input.labOrderId } });
    });
    const mapped = mapOrder(result);
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'update', entity: 'LabOrder', entityId: mapped.id, requestId: actor.requestId, reason: input.reason, metadata: { action: 'reportRework' } });
    return mapped;
  }

  async getOrder(labOrderId: string, actor: ActorContext): Promise<LabOrder | null> {
    if (!authorize(actor.role, 'read', 'LabOrder')) throw new Error('Permission denied');
    const order = await this.find(labOrderId);
    return order ? mapOrder(order) : null;
  }

  async listOrders(branchId: string, actor: ActorContext): Promise<LabOrder[]> {
    if (!authorize(actor.role, 'read', 'LabOrder')) throw new Error('Permission denied');
    const branch = await this.branch(branchId);
    const orders = await prisma.labOrder.findMany({ where: { branchId: branch.id }, orderBy: { createdAt: 'desc' } });
    return orders.map(mapOrder);
  }

  async getTraySlip(labOrderId: string, actor: ActorContext): Promise<TraySlipData> {
    const order = await this.getOrder(labOrderId, actor);
    if (!order) throw new Error('Orden de laboratorio no encontrada');
    return formatTraySlip(order);
  }
}

export const prismaLaboratoryService = new PrismaLaboratoryService();
