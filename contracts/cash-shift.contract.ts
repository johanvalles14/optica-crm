/**
 * Contrato del módulo cash para SPEC-004.
 * Define operaciones de apertura de turno, gastos menores, arqueo ciego y saldos en la calle.
 */

import type { ActorContext, UserId } from './auth.contract';
import type { BranchId, Folio } from './patients.contract';
import type { SaleOrderFolio, SaleOrderId } from './sales.contract';

export type CashShiftId = string;
export type CashExpenseId = string;

export type ShiftStatus = 'open' | 'closed';

export interface CashExpense {
  id: CashExpenseId;
  shiftId: CashShiftId;
  amount: number;
  description: string;
  receiptNumber?: string;
  actorId: UserId;
  occurredAt: Date;
}

export interface PaymentBreakdown {
  cashTotal: number;
  cardTotal: number;
  transferTotal: number;
  totalCollected: number;
  cashTransactions: number;
  cardTransactions: number;
  transferTransactions: number;
}

export interface CashShift {
  id: CashShiftId;
  branchId: BranchId;
  cashierId: UserId;
  status: ShiftStatus;
  openedAt: Date;
  closedAt?: Date;
  initialFloat: number; // Fondo inicial de cambio / morralla
  expensesTotal: number;
  expectedCash?: number;   // Fondo + Cobros efectivo - Gastos efectivo
  declaredCash?: number;   // Lo que el cajero contó físicamente en el arqueo ciego
  cashDifference?: number; // declaredCash - expectedCash (0 = cuadrado, <0 = faltante, >0 = sobrante)
  cardTotal?: number;
  transferTotal?: number;
  totalCollected?: number;
  notes?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpenShiftInput {
  branchId: BranchId;
  initialFloat: number;
}

export interface RecordExpenseInput {
  shiftId: CashShiftId;
  amount: number;
  description: string;
  receiptNumber?: string;
}

export interface CloseShiftInput {
  shiftId: CashShiftId;
  declaredCash: number; // Arqueo ciego: dinero físico contado
  notes?: string;
  expectedVersion: number;
}

export interface PendingBalanceItem {
  orderId: SaleOrderId;
  folio: SaleOrderFolio;
  patientName: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
  orderStatus: string;
  promisedDeliveryDate?: Date;
  createdAt: Date;
}

export interface AccountsReceivableReport {
  branchId: BranchId;
  totalOutstandingBalance: number;
  totalOrdersWithBalance: number;
  items: PendingBalanceItem[];
  generatedAt: Date;
}

export interface ICashService {
  openShift(input: OpenShiftInput, actor: ActorContext): Promise<CashShift>;
  getCurrentShift(branchId: BranchId, actor: ActorContext): Promise<CashShift | null>;
  recordExpense(input: RecordExpenseInput, actor: ActorContext): Promise<CashExpense>;
  closeShift(input: CloseShiftInput, actor: ActorContext): Promise<CashShift>;
  getShift(shiftId: CashShiftId, actor: ActorContext): Promise<CashShift | null>;
  listShifts(branchId: BranchId, actor: ActorContext): Promise<CashShift[]>;
  getAccountsReceivable(branchId: BranchId, actor: ActorContext): Promise<AccountsReceivableReport>;
}
