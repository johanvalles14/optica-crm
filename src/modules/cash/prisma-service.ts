import type { Prisma } from '@prisma/client';
import type { ActorContext } from '../../../contracts/auth.contract';
import type {
  AccountsReceivableReport,
  CashExpense,
  CashShift,
  CloseShiftInput,
  ICashService,
  OpenShiftInput,
  PaymentBreakdown,
  RecordExpenseInput,
} from '../../../contracts/cash-shift.contract';
import { prisma } from '../../lib/prisma';
import { authorize } from '../auth/rbac';
import { AuditService } from '../audit/service';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

type ShiftRecord = Prisma.CashShiftGetPayload<{}>;
type PaymentReader = {
  payment: {
    findMany(args: Prisma.PaymentFindManyArgs): Promise<Array<{ amount: Prisma.Decimal; method: string }> >;
  };
};

function mapShift(record: ShiftRecord): CashShift {
  return {
    id: record.id,
    branchId: record.branchId,
    cashierId: record.cashierId,
    status: record.status,
    openedAt: record.openedAt,
    closedAt: record.closedAt ?? undefined,
    initialFloat: Number(record.initialFloat),
    expensesTotal: Number(record.expensesTotal),
    expectedCash: record.expectedCash === null ? undefined : Number(record.expectedCash),
    declaredCash: record.declaredCash === null ? undefined : Number(record.declaredCash),
    cashDifference: record.cashDifference === null ? undefined : Number(record.cashDifference),
    cardTotal: record.cardTotal === null ? undefined : Number(record.cardTotal),
    transferTotal: record.transferTotal === null ? undefined : Number(record.transferTotal),
    totalCollected: record.totalCollected === null ? undefined : Number(record.totalCollected),
    notes: record.notes ?? undefined,
    version: record.version,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapExpense(record: { id: string; shiftId: string; amount: Prisma.Decimal; description: string; receiptNumber: string | null; actorId: string; occurredAt: Date }): CashExpense {
  return { id: record.id, shiftId: record.shiftId, amount: Number(record.amount), description: record.description, receiptNumber: record.receiptNumber ?? undefined, actorId: record.actorId, occurredAt: record.occurredAt };
}

export class PrismaCashService implements ICashService {
  private readonly audit = new AuditService();

  private async branch(branchId: string) {
    const key = branchId === 'branch-001' ? 'PT' : branchId;
    return prisma.branch.findFirstOrThrow({ where: isUuid(key) ? { OR: [{ id: key }, { code: key }] } : { code: key } });
  }

  async openShift(input: OpenShiftInput, actor: ActorContext): Promise<CashShift> {
    if (!authorize(actor.role, 'openShift', 'CashShift')) throw new Error('Permission denied');
    if (input.initialFloat < 0) throw new Error('El fondo inicial debe ser mayor o igual a cero');
    const branch = await this.branch(input.branchId);
    const existing = await prisma.cashShift.findFirst({ where: { branchId: branch.id, status: 'open' } });
    if (existing) throw new Error('Ya existe un turno activo en esta sucursal');
    const shift = await prisma.cashShift.create({ data: { branchId: branch.id, cashierId: actor.actorId, initialFloat: input.initialFloat } });
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'create', entity: 'CashShift', entityId: shift.id, requestId: actor.requestId, metadata: { branchId: branch.id, initialFloat: input.initialFloat } });
    return mapShift(shift);
  }

  async getCurrentShift(branchId: string, actor: ActorContext): Promise<CashShift | null> {
    if (!authorize(actor.role, 'read', 'CashShift')) throw new Error('Permission denied');
    const branch = await this.branch(branchId);
    const shift = await prisma.cashShift.findFirst({ where: { branchId: branch.id, status: 'open' }, orderBy: { openedAt: 'desc' } });
    return shift ? mapShift(shift) : null;
  }

  async recordExpense(input: RecordExpenseInput, actor: ActorContext): Promise<CashExpense> {
    if (!authorize(actor.role, 'recordExpense', 'CashShift')) throw new Error('Permission denied');
    if (input.amount <= 0) throw new Error('El importe del gasto debe ser mayor a cero');
    if (!input.description.trim()) throw new Error('La descripción del gasto es obligatoria');
    const expense = await prisma.$transaction(async (transaction) => {
      const shift = await transaction.cashShift.findUnique({ where: { id: input.shiftId } });
      if (!shift || shift.status !== 'open') throw new Error('El turno no existe o ya está cerrado');
      await transaction.cashShift.update({ where: { id: shift.id }, data: { expensesTotal: { increment: input.amount }, version: { increment: 1 } } });
      return transaction.cashExpense.create({ data: { shiftId: shift.id, amount: input.amount, description: input.description.trim(), receiptNumber: input.receiptNumber, actorId: actor.actorId } });
    });
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'create', entity: 'CashExpense', entityId: expense.id, requestId: actor.requestId, metadata: { shiftId: input.shiftId, amount: input.amount } });
    return mapExpense(expense);
  }

  private async breakdown(shift: ShiftRecord, transaction: PaymentReader = prisma): Promise<PaymentBreakdown> {
    const payments = await transaction.payment.findMany({ where: { saleOrder: { branchId: shift.branchId }, paidAt: { gte: shift.openedAt, ...(shift.closedAt ? { lte: shift.closedAt } : {}) } }, select: { amount: true, method: true } });
    const cash = payments.filter((payment) => payment.method === 'cash');
    const cards = payments.filter((payment) => payment.method === 'card_debit' || payment.method === 'card_credit');
    const transfers = payments.filter((payment) => payment.method === 'transfer');
    const cashTotal = cash.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const cardTotal = cards.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const transferTotal = transfers.reduce((sum, payment) => sum + Number(payment.amount), 0);
    return { cashTotal, cardTotal, transferTotal, totalCollected: cashTotal + cardTotal + transferTotal, cashTransactions: cash.length, cardTransactions: cards.length, transferTransactions: transfers.length };
  }

  async closeShift(input: CloseShiftInput, actor: ActorContext): Promise<CashShift> {
    if (!authorize(actor.role, 'closeShift', 'CashShift')) throw new Error('Permission denied');
    if (input.declaredCash < 0) throw new Error('El efectivo declarado no puede ser negativo');
    const current = await prisma.cashShift.findUnique({ where: { id: input.shiftId } });
    if (!current || current.status !== 'open') throw new Error('El turno no existe o ya está cerrado');
    if (current.version !== input.expectedVersion) throw new Error('Stale version: expectedVersion does not match');
    const closedAt = new Date();
    const closed = await prisma.$transaction(async (transaction) => {
      const breakdown = await this.breakdown({ ...current, closedAt }, transaction);
      const expectedCash = Number(current.initialFloat) + breakdown.cashTotal - Number(current.expensesTotal);
      const result = await transaction.cashShift.updateMany({ where: { id: input.shiftId, status: 'open', version: input.expectedVersion }, data: { status: 'closed', closedAt, expectedCash, declaredCash: input.declaredCash, cashDifference: input.declaredCash - expectedCash, cardTotal: breakdown.cardTotal, transferTotal: breakdown.transferTotal, totalCollected: breakdown.totalCollected, notes: input.notes, version: { increment: 1 } } });
      if (result.count !== 1) throw new Error('Stale version: expectedVersion does not match');
      return transaction.cashShift.findUniqueOrThrow({ where: { id: input.shiftId } });
    });
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'update', entity: 'CashShift', entityId: closed.id, requestId: actor.requestId, metadata: { action: 'closeShift', cashDifference: Number(closed.cashDifference) } });
    return mapShift(closed);
  }

  async getShift(shiftId: string, actor: ActorContext): Promise<CashShift | null> {
    if (!authorize(actor.role, 'read', 'CashShift')) throw new Error('Permission denied');
    const shift = await prisma.cashShift.findUnique({ where: { id: shiftId } });
    return shift ? mapShift(shift) : null;
  }

  async listShifts(branchId: string, actor: ActorContext): Promise<CashShift[]> {
    if (!authorize(actor.role, 'read', 'CashShift')) throw new Error('Permission denied');
    const branch = await this.branch(branchId);
    const shifts = await prisma.cashShift.findMany({ where: { branchId: branch.id }, orderBy: { openedAt: 'desc' } });
    return shifts.map(mapShift);
  }

  async getAccountsReceivable(branchId: string, actor: ActorContext): Promise<AccountsReceivableReport> {
    if (!authorize(actor.role, 'read', 'CashShift')) throw new Error('Permission denied');
    const branch = await this.branch(branchId);
    const orders = await prisma.saleOrder.findMany({ where: { branchId: branch.id, balanceDue: { gt: 0 }, status: { notIn: ['cancelled', 'delivered_paid'] } }, include: { patient: { select: { firstName: true, middleName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } });
    const items = orders.map((order) => ({ orderId: order.id, folio: order.folio, patientName: order.patient ? [order.patient.firstName, order.patient.middleName, order.patient.lastName].filter(Boolean).join(' ') : 'Sin nombre', total: Number(order.total), paidAmount: Number(order.paidAmount), balanceDue: Number(order.balanceDue), orderStatus: order.status, promisedDeliveryDate: order.promisedDeliveryDate ?? undefined, createdAt: order.createdAt }));
    return { branchId, totalOutstandingBalance: items.reduce((sum, item) => sum + item.balanceDue, 0), totalOrdersWithBalance: items.length, items, generatedAt: new Date() };
  }
}

export const prismaCashService = new PrismaCashService();
