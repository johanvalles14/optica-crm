import { randomUUID } from 'node:crypto';
import type { ActorContext } from '../../../contracts/auth.contract';
import type { CreateLabOrderInput, AssignLabDestinationInput, EyeLabData, ILaboratoryService, LabOrder, LabOrderStatus, ReportReworkInput, TraySlipData } from '../../../contracts/laboratory.contract';
import { authorize } from '../auth/rbac';
import { AuditService } from '../audit/service';
import { InventoryService } from '../inventory/service';
import { salesRepository } from '../sales/repository';
import { formatTraySlip } from './tray-slip.service';
import { laboratoryRepository } from './repository';
import { LabStateMachine } from './state-machine';

let labSequence = 1;
const stateMachine = new LabStateMachine();

function nextFolio(): string {
  return `LAB-${String(labSequence++).padStart(4, '0')}`;
}

function copyEyeData(value: EyeLabData): EyeLabData {
  return { ...value };
}

export class LaboratoryService implements ILaboratoryService {
  private readonly audit = new AuditService();
  private readonly inventory = new InventoryService();

  async createOrder(input: CreateLabOrderInput, actor: ActorContext): Promise<LabOrder> {
    if (!authorize(actor.role, 'create', 'LabOrder')) throw new Error('Permission denied');
    if (!input.saleOrderId || !input.saleOrderFolio || !input.patientName || !input.frameCode || !input.lensMaterial) {
      throw new Error('Datos incompletos para crear la orden de laboratorio');
    }
    const now = new Date();
    const order: LabOrder = {
      id: randomUUID(),
      folio: nextFolio(),
      saleOrderId: input.saleOrderId,
      saleOrderFolio: input.saleOrderFolio,
      branchId: input.branchId,
      patientName: input.patientName,
      destination: input.destination ?? 'internal_workshop',
      externalLabName: undefined,
      externalGuideNumber: undefined,
      expectedReturnDate: input.expectedReturnDate,
      status: 'queued',
      frameCode: input.frameCode,
      frameDescription: input.frameDescription,
      frameMountingType: input.frameMountingType ?? 'full_rim',
      lensMaterial: input.lensMaterial,
      treatments: [...(input.treatments ?? [])],
      rightEye: copyEyeData(input.rightEye),
      leftEye: copyEyeData(input.leftEye),
      observations: input.observations,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    laboratoryRepository.saveOrder(order);
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'create', entity: 'LabOrder', entityId: order.id, requestId: actor.requestId, metadata: { folio: order.folio } });
    return order;
  }

  async assignDestination(input: AssignLabDestinationInput, actor: ActorContext): Promise<LabOrder> {
    if (!authorize(actor.role, 'update', 'LabOrder')) throw new Error('Permission denied');
    const order = laboratoryRepository.getOrder(input.labOrderId);
    if (!order) throw new Error('Orden de laboratorio no encontrada');
    if (order.version !== input.expectedVersion) throw new Error('Stale version: expectedVersion does not match');
    const updated: LabOrder = { ...order, destination: input.destination, externalLabName: input.externalLabName, externalGuideNumber: input.externalGuideNumber, expectedReturnDate: input.expectedReturnDate, status: input.destination === 'external_lab' ? 'in_process' : order.status, version: order.version + 1, updatedAt: new Date() };
    laboratoryRepository.saveOrder(updated);
    return updated;
  }

  async updateStatus(labOrderId: string, newStatus: LabOrderStatus, expectedVersion: number, actor: ActorContext): Promise<LabOrder> {
    if (!authorize(actor.role, 'update', 'LabOrder')) throw new Error('Permission denied');
    const order = laboratoryRepository.getOrder(labOrderId);
    if (!order) throw new Error('Orden de laboratorio no encontrada');
    if (order.version !== expectedVersion) throw new Error('Stale version: expectedVersion does not match');
    const actionByStatus: Partial<Record<LabOrderStatus, Parameters<LabStateMachine['transition']>[1]>> = { in_process: 'start_process', quality_control: 'send_qc', completed: 'approve', rework_needed: 'restart', cancelled: 'cancel' };
    const action = actionByStatus[newStatus];
    if (!action || stateMachine.transition(order.status, action) !== newStatus) throw new Error(`Invalid transition to ${newStatus}`);
    const updated = { ...order, status: newStatus, version: order.version + 1, updatedAt: new Date() };
    laboratoryRepository.saveOrder(updated);
    return updated;
  }

  async approveQuality(labOrderId: string, expectedVersion: number, actor: ActorContext): Promise<LabOrder> {
    if (!authorize(actor.role, 'approveQuality', 'LabOrder')) throw new Error('Permission denied');
    const order = laboratoryRepository.getOrder(labOrderId);
    if (!order) throw new Error('Orden de laboratorio no encontrada');
    if (order.version !== expectedVersion) throw new Error('Stale version: expectedVersion does not match');
    const updated: LabOrder = { ...order, status: order.status === 'queued' ? 'completed' : stateMachine.transition(order.status, 'approve'), qualityApprovedAt: new Date(), qualityApprovedBy: actor.actorId, version: order.version + 1, updatedAt: new Date() };
    laboratoryRepository.saveOrder(updated);
    const sale = salesRepository.getOrder(order.saleOrderId);
    if (sale && sale.status === 'confirmed_in_process') {
      sale.status = 'ready_for_delivery';
      salesRepository.saveOrder(sale);
    }
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'update', entity: 'LabOrder', entityId: order.id, requestId: actor.requestId, metadata: { action: 'approveQuality' } });
    return updated;
  }

  async reportRework(input: ReportReworkInput, actor: ActorContext): Promise<LabOrder> {
    if (!authorize(actor.role, 'reportRework', 'LabOrder')) throw new Error('Permission denied');
    if (!input.reason.trim()) throw new Error('El motivo de repetición es obligatorio');
    const order = laboratoryRepository.getOrder(input.labOrderId);
    if (!order) throw new Error('Orden de laboratorio no encontrada');
    if (order.version !== input.expectedVersion) throw new Error('Stale version: expectedVersion does not match');
    if (input.brokenProductId && input.brokenQuantity && input.brokenQuantity > 0) {
      await this.inventory.recordAdjustment({ productId: input.brokenProductId, quantity: -input.brokenQuantity, reason: 'damage_breakage', notes: `Merma de taller: ${input.reason}` }, actor);
    }
    const sale = salesRepository.getOrder(order.saleOrderId);
    if (sale) {
      sale.notes = [sale.notes, `REPETICIÓN / MERMA: ${input.reason}`].filter(Boolean).join(' | ');
      salesRepository.saveOrder(sale);
    }
    const expectedReturnDate = order.expectedReturnDate && input.additionalDeliveryDays ? new Date(order.expectedReturnDate.getTime() + input.additionalDeliveryDays * 86400000) : order.expectedReturnDate;
    const updated: LabOrder = { ...order, status: stateMachine.transition(order.status, 'report_damage'), reworkReason: input.reason, expectedReturnDate, version: order.version + 1, updatedAt: new Date() };
    laboratoryRepository.saveOrder(updated);
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'update', entity: 'LabOrder', entityId: order.id, requestId: actor.requestId, reason: input.reason, metadata: { action: 'reportRework' } });
    return updated;
  }

  async getOrder(labOrderId: string, _actor: ActorContext): Promise<LabOrder | null> {
    if (!authorize(_actor.role, 'read', 'LabOrder')) throw new Error('Permission denied');
    return laboratoryRepository.getOrder(labOrderId) ?? null;
  }

  async listOrders(branchId: string, _actor: ActorContext): Promise<LabOrder[]> {
    if (!authorize(_actor.role, 'read', 'LabOrder')) throw new Error('Permission denied');
    return laboratoryRepository.listOrders(branchId);
  }

  async getTraySlip(labOrderId: string, actor: ActorContext): Promise<TraySlipData> {
    if (!authorize(actor.role, 'read', 'LabOrder')) throw new Error('Permission denied');
    const order = laboratoryRepository.getOrder(labOrderId);
    if (!order) throw new Error('Orden de laboratorio no encontrada');
    return formatTraySlip(order);
  }
}
