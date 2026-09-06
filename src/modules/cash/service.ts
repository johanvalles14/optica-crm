import { randomUUID } from 'node:crypto';
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
import { authorize } from '../auth/rbac';
import { AuditService } from '../audit/service';
import { salesRepository } from '../sales/repository';

const shifts = new Map<string, CashShift>();
const expenses = new Map<string, CashExpense>();

function copyShift(shift: CashShift): CashShift {
  return { ...shift };
}

function paymentBreakdown(shift: CashShift): PaymentBreakdown {
  const orders = salesRepository.listOrders(shift.branchId);
  const payments = orders.flatMap((order) => order.payments).filter((payment) => payment.paidAt >= shift.openedAt && (!shift.closedAt || payment.paidAt <= shift.closedAt));
  const cashTotal = payments.filter((payment) => payment.method === 'cash').reduce((sum, payment) => sum + payment.amount, 0);
  const cardTotal = payments.filter((payment) => payment.method === 'card_debit' || payment.method === 'card_credit').reduce((sum, payment) => sum + payment.amount, 0);
  const transferTotal = payments.filter((payment) => payment.method === 'transfer').reduce((sum, payment) => sum + payment.amount, 0);
  return {
    cashTotal,
    cardTotal,
    transferTotal,
    totalCollected: cashTotal + cardTotal + transferTotal,
    cashTransactions: payments.filter((payment) => payment.method === 'cash').length,
    cardTransactions: payments.filter((payment) => payment.method === 'card_debit' || payment.method === 'card_credit').length,
    transferTransactions: payments.filter((payment) => payment.method === 'transfer').length,
  };
}

export class CashService implements ICashService {
  private readonly audit = new AuditService();

  async openShift(input: OpenShiftInput, actor: ActorContext): Promise<CashShift> {
    if (!authorize(actor.role, 'openShift', 'CashShift')) throw new Error('Permission denied');
    if (input.initialFloat < 0) throw new Error('El fondo inicial debe ser mayor o igual a cero');
    if (Array.from(shifts.values()).some((shift) => shift.branchId === input.branchId && shift.status === 'open')) {
      throw new Error('Ya existe un turno activo en esta sucursal');
    }
    const now = new Date();
    const shift: CashShift = {
      id: randomUUID(),
      branchId: input.branchId,
      cashierId: actor.actorId,
      status: 'open',
      openedAt: now,
      initialFloat: input.initialFloat,
      expensesTotal: 0,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    shifts.set(shift.id, shift);
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'create', entity: 'CashShift', entityId: shift.id, requestId: actor.requestId, metadata: { branchId: shift.branchId, initialFloat: shift.initialFloat } });
    return shift;
  }

  async getCurrentShift(branchId: string, actor: ActorContext): Promise<CashShift | null> {
    if (!authorize(actor.role, 'read', 'CashShift')) throw new Error('Permission denied');
    const shift = Array.from(shifts.values()).find((candidate) => candidate.branchId === branchId && candidate.status === 'open');
    return shift ? copyShift(shift) : null;
  }

  async recordExpense(input: RecordExpenseInput, actor: ActorContext): Promise<CashExpense> {
    if (!authorize(actor.role, 'recordExpense', 'CashShift')) throw new Error('Permission denied');
    if (input.amount <= 0) throw new Error('El importe del gasto debe ser mayor a cero');
    if (!input.description.trim()) throw new Error('La descripción del gasto es obligatoria');
    const shift = shifts.get(input.shiftId);
    if (!shift || shift.status !== 'open') throw new Error('El turno no existe o ya está cerrado');
    const expense: CashExpense = { id: randomUUID(), shiftId: shift.id, amount: input.amount, description: input.description.trim(), receiptNumber: input.receiptNumber, actorId: actor.actorId, occurredAt: new Date() };
    expenses.set(expense.id, expense);
    shift.expensesTotal += expense.amount;
    shift.version += 1;
    shift.updatedAt = new Date();
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'create', entity: 'CashExpense', entityId: expense.id, requestId: actor.requestId, metadata: { shiftId: shift.id, amount: expense.amount } });
    return { ...expense };
  }

  async closeShift(input: CloseShiftInput, actor: ActorContext): Promise<CashShift> {
    if (!authorize(actor.role, 'closeShift', 'CashShift')) throw new Error('Permission denied');
    if (input.declaredCash < 0) throw new Error('El efectivo declarado no puede ser negativo');
    const shift = shifts.get(input.shiftId);
    if (!shift || shift.status !== 'open') throw new Error('El turno no existe o ya está cerrado');
    if (shift.version !== input.expectedVersion) throw new Error('Stale version: expectedVersion does not match');
    const breakdown = paymentBreakdown(shift);
    const expectedCash = shift.initialFloat + breakdown.cashTotal - shift.expensesTotal;
    const now = new Date();
    shift.status = 'closed';
    shift.closedAt = now;
    shift.expectedCash = expectedCash;
    shift.declaredCash = input.declaredCash;
    shift.cashDifference = input.declaredCash - expectedCash;
    shift.cardTotal = breakdown.cardTotal;
    shift.transferTotal = breakdown.transferTotal;
    shift.totalCollected = breakdown.totalCollected;
    shift.notes = input.notes;
    shift.updatedAt = now;
    shift.version += 1;
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'update', entity: 'CashShift', entityId: shift.id, requestId: actor.requestId, metadata: { action: 'closeShift', cashDifference: shift.cashDifference } });
    return copyShift(shift);
  }

  async getShift(shiftId: string, actor: ActorContext): Promise<CashShift | null> {
    if (!authorize(actor.role, 'read', 'CashShift')) throw new Error('Permission denied');
    const shift = shifts.get(shiftId);
    return shift ? copyShift(shift) : null;
  }

  async listShifts(branchId: string, actor: ActorContext): Promise<CashShift[]> {
    if (!authorize(actor.role, 'read', 'CashShift')) throw new Error('Permission denied');
    return Array.from(shifts.values()).filter((shift) => shift.branchId === branchId).map(copyShift);
  }

  async getAccountsReceivable(branchId: string, actor: ActorContext): Promise<AccountsReceivableReport> {
    if (!authorize(actor.role, 'read', 'CashShift')) throw new Error('Permission denied');
    const items = salesRepository.listOrders(branchId).filter((order) => order.balanceDue > 0 && order.status !== 'cancelled' && order.status !== 'delivered_paid').map((order) => ({ orderId: order.id, folio: order.folio, patientName: order.patientName ?? 'Sin nombre', total: order.total, paidAmount: order.paidAmount, balanceDue: order.balanceDue, orderStatus: order.status, promisedDeliveryDate: order.promisedDeliveryDate, createdAt: order.createdAt }));
    return { branchId, totalOutstandingBalance: items.reduce((sum, item) => sum + item.balanceDue, 0), totalOrdersWithBalance: items.length, items, generatedAt: new Date() };
  }
}
