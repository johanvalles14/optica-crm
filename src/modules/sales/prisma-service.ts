import type { Prisma } from '@prisma/client';
import type { ActorContext } from '../../../contracts/auth.contract';
import type { CreateSaleOrderInput, PaymentRecord, RecordPaymentInput, SaleItem, SaleOrder } from '../../../contracts/sales.contract';
import { prisma } from '../../lib/prisma';
import { authorize } from '../auth/rbac';
import { AuditService } from '../audit/service';
import { OrderStateMachine } from './state-machine';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function mapPayment(record: { id: string; amount: Prisma.Decimal; method: PaymentRecord['method']; reference: string | null; receivedBy: string; paidAt: Date }): PaymentRecord {
  return { id: record.id, amount: Number(record.amount), method: record.method, reference: record.reference ?? undefined, receivedBy: record.receivedBy, paidAt: record.paidAt };
}

function mapOrder(record: {
  id: string;
  folio: string;
  branchId: string;
  patientId: string | null;
  prescriptionId: string | null;
  status: SaleOrder['status'];
  subtotal: Prisma.Decimal;
  discount: Prisma.Decimal;
  total: Prisma.Decimal;
  paidAmount: Prisma.Decimal;
  balanceDue: Prisma.Decimal;
  promisedDeliveryDate: Date | null;
  deliveredAt: Date | null;
  notes: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{ id: string; itemType: SaleItem['itemType']; productId: string | null; description: string; lensConfig: Prisma.JsonValue | null; quantity: number; unitPrice: Prisma.Decimal; totalPrice: Prisma.Decimal }>;
  payments: Array<{ id: string; amount: Prisma.Decimal; method: PaymentRecord['method']; reference: string | null; receivedBy: string; paidAt: Date }>;
  patient?: { firstName: string; middleName: string | null; lastName: string } | null;
}): SaleOrder {
  return {
    id: record.id,
    folio: record.folio,
    branchId: record.branchId,
    patientId: record.patientId ?? undefined,
    patientName: record.patient ? [record.patient.firstName, record.patient.middleName, record.patient.lastName].filter(Boolean).join(' ') : undefined,
    prescriptionId: record.prescriptionId ?? undefined,
    status: record.status,
    items: record.items.map((item) => ({ id: item.id, itemType: item.itemType, productId: item.productId ?? undefined, description: item.description, lensConfig: item.lensConfig as unknown as SaleItem['lensConfig'], quantity: item.quantity, unitPrice: Number(item.unitPrice), totalPrice: Number(item.totalPrice) })),
    subtotal: Number(record.subtotal),
    discount: Number(record.discount),
    total: Number(record.total),
    paidAmount: Number(record.paidAmount),
    balanceDue: Number(record.balanceDue),
    promisedDeliveryDate: record.promisedDeliveryDate ?? undefined,
    deliveredAt: record.deliveredAt ?? undefined,
    notes: record.notes ?? undefined,
    version: record.version,
    payments: record.payments.map(mapPayment),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

const orderInclude = {
  items: true,
  payments: true,
  patient: { select: { firstName: true, middleName: true, lastName: true } },
} as const;

export class PrismaSalesService {
  private readonly audit = new AuditService();
  private readonly stateMachine = new OrderStateMachine();

  private async branch(branchId: string) {
    const key = branchId === 'branch-001' ? 'PT' : branchId;
    return prisma.branch.findFirstOrThrow({ where: isUuid(key) ? { OR: [{ id: key }, { code: key }] } : { code: key } });
  }

  async createOrder(input: CreateSaleOrderInput, actor: ActorContext): Promise<SaleOrder> {
    if (!authorize(actor.role, 'createOrder', 'SaleOrder')) throw new Error('Permission denied');
    if (!input.items?.length) throw new Error('La orden de venta debe contener al menos un producto o servicio');
    const order = await prisma.$transaction(async (transaction) => {
      const branch = await transaction.branch.update({ where: { id: (await this.branch(input.branchId)).id }, data: { nextSaleSequence: { increment: 1 } } });
      let subtotal = 0;
      const items: Array<Omit<SaleItem, 'id' | 'totalPrice'>> = [];
      for (const item of input.items) {
        if (item.quantity <= 0 || item.unitPrice < 0) throw new Error('Cantidad y precio inválidos');
        const totalPrice = item.unitPrice * item.quantity;
        subtotal += totalPrice;
        if (item.productId) {
          const product = await transaction.product.findFirst({ where: { id: item.productId, branchId: branch.id, active: true } });
          if (!product) throw new Error('Producto no encontrado');
          const updated = await transaction.product.updateMany({ where: { id: product.id, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity }, version: { increment: 1 }, updatedAt: new Date() } });
          if (updated.count !== 1) throw new Error('Stock insuficiente');
          await transaction.inventoryMovement.create({ data: { productId: product.id, branchId: branch.id, movementType: 'out', quantityChange: -item.quantity, previousStock: product.stock, newStock: product.stock - item.quantity, reason: 'sale', notes: 'Venta directa mostrador', actorId: actor.actorId } });
        }
        items.push(item);
      }
      const discount = input.discount ?? 0;
      const total = Math.max(0, subtotal - discount);
      const initialPayment = input.initialPayment?.amount && input.initialPayment.amount > 0 ? input.initialPayment : undefined;
      const paidAmount = initialPayment?.amount ?? 0;
      const now = new Date();
      const record = await transaction.saleOrder.create({ data: { folio: `VTA-${String(branch.nextSaleSequence - 1).padStart(4, '0')}`, branchId: branch.id, patientId: input.patientId, prescriptionId: input.prescriptionId, status: paidAmount > 0 ? 'confirmed_in_process' : 'quote', subtotal, discount, total, paidAmount, balanceDue: Math.max(0, total - paidAmount), promisedDeliveryDate: input.promisedDeliveryDate, notes: input.notes, createdAt: now, updatedAt: now, items: { create: items.map((item) => ({ productId: item.productId, itemType: item.itemType, description: item.description, lensConfig: item.lensConfig ? toJson(item.lensConfig) : undefined, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.unitPrice * item.quantity })) }, payments: initialPayment ? { create: { amount: initialPayment.amount, method: initialPayment.method, reference: initialPayment.reference, receivedBy: actor.actorId, paidAt: now } } : undefined }, include: orderInclude });
      return mapOrder(record);
    });
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'create', entity: 'SaleOrder', entityId: order.id, requestId: actor.requestId, metadata: { folio: order.folio, total: order.total, paidAmount: order.paidAmount } });
    return order;
  }

  async recordPayment(input: RecordPaymentInput, actor: ActorContext): Promise<SaleOrder> {
    if (!authorize(actor.role, 'recordPayment', 'SaleOrder')) throw new Error('Permission denied');
    const order = await prisma.$transaction(async (transaction) => {
      const current = await transaction.saleOrder.findUnique({ where: { id: input.orderId } });
      if (!current) throw new Error('Orden no encontrada');
      if (this.stateMachine.isFinal(current.status)) throw new Error('No se pueden registrar pagos en órdenes finalizadas o canceladas');
      if (input.amount <= 0) throw new Error('El pago debe ser mayor a cero');
      const paidAmount = Number(current.paidAmount) + input.amount;
      const result = await transaction.saleOrder.updateMany({ where: { id: current.id, version: input.expectedVersion }, data: { paidAmount, balanceDue: Math.max(0, Number(current.total) - paidAmount), status: current.status === 'pending_deposit' ? 'confirmed_in_process' : current.status, version: { increment: 1 }, updatedAt: new Date() } });
      if (result.count !== 1) throw new Error('Stale version: expectedVersion does not match');
      await transaction.payment.create({ data: { saleOrderId: current.id, amount: input.amount, method: input.method, reference: input.reference, receivedBy: actor.actorId } });
      return transaction.saleOrder.findUniqueOrThrow({ where: { id: current.id }, include: orderInclude });
    }).then(mapOrder);
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'update', entity: 'SaleOrder', entityId: order.id, requestId: actor.requestId, metadata: { paymentAmount: input.amount, balanceDue: order.balanceDue } });
    return order;
  }

  async getOrder(orderId: string): Promise<SaleOrder | null> {
    const record = await prisma.saleOrder.findUnique({ where: { id: orderId }, include: orderInclude });
    return record ? mapOrder(record) : null;
  }

  async listOrders(branchId: string): Promise<SaleOrder[]> {
    const branch = await this.branch(branchId);
    const records = await prisma.saleOrder.findMany({ where: { branchId: branch.id }, include: orderInclude, orderBy: { createdAt: 'desc' } });
    return records.map(mapOrder);
  }
}

export const prismaSalesService = new PrismaSalesService();
