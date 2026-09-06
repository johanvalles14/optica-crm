import { describe, it, expect } from 'vitest';
import { CashService } from '../../../src/modules/cash/service';
import { receptionist } from '../../fixtures/actors';

describe('RF-302 — Registro de Gastos Menores (Caja Chica)', () => {
  const service = new CashService();
  const actorRec = receptionist('req-cash-exp-01');

  it('registra salida menor de efectivo y actualiza expensesTotal del turno', async () => {
    const shift = await service.openShift({
      branchId: 'branch-exp-01',
      initialFloat: 400,
    }, actorRec);

    const expense = await service.recordExpense({
      shiftId: shift.id,
      amount: 65,
      description: 'Garrafón de agua purificada y vasos',
      receiptNumber: 'REC-092',
    }, actorRec);

    expect(expense.id).toBeDefined();
    expect(expense.amount).toBe(65);
    expect(expense.description).toContain('Garrafón');

    const updatedShift = await service.getShift(shift.id, actorRec);
    expect(updatedShift?.expensesTotal).toBe(65);
  });

  it('rechaza gasto con importe menor o igual a cero', async () => {
    const shift = await service.getCurrentShift('branch-exp-01', actorRec);
    expect(shift).toBeDefined();

    await expect(
      service.recordExpense({
        shiftId: shift!.id,
        amount: 0,
        description: 'Error monto cero',
      }, actorRec)
    ).rejects.toThrow(/monto|importe/i);
  });

  it('rechaza gasto sin concepto o descripción', async () => {
    const shift = await service.getCurrentShift('branch-exp-01', actorRec);

    await expect(
      service.recordExpense({
        shiftId: shift!.id,
        amount: 50,
        description: '   ',
      }, actorRec)
    ).rejects.toThrow(/concepto|descripci[oó]n/i);
  });
});
