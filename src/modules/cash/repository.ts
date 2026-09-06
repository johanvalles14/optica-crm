import type {
  CashExpense,
  CashExpenseId,
  CashShift,
  CashShiftId,
} from '../../../contracts/cash-shift.contract';
import type { BranchId } from '../../../contracts/patients.contract';

class CashRepository {
  private shifts = new Map<CashShiftId, CashShift>();
  private expenses = new Map<CashExpenseId, CashExpense>();

  saveShift(shift: CashShift): CashShift {
    this.shifts.set(shift.id, { ...shift, updatedAt: new Date() });
    return this.shifts.get(shift.id)!;
  }

  getShift(id: CashShiftId): CashShift | undefined {
    return this.shifts.get(id);
  }

  getActiveShift(branchId: BranchId): CashShift | undefined {
    for (const shift of this.shifts.values()) {
      if (shift.branchId === branchId && shift.status === 'open') {
        return shift;
      }
    }
    return undefined;
  }

  listShifts(branchId: BranchId): CashShift[] {
    return Array.from(this.shifts.values()).filter((s) => s.branchId === branchId);
  }

  saveExpense(expense: CashExpense): CashExpense {
    this.expenses.set(expense.id, expense);
    return expense;
  }

  listExpensesByShift(shiftId: CashShiftId): CashExpense[] {
    return Array.from(this.expenses.values()).filter((e) => e.shiftId === shiftId);
  }
}

export const cashRepository = new CashRepository();
