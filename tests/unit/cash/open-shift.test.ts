import { describe, it, expect } from 'vitest';
import { CashService } from '../../../src/modules/cash/service';
import { receptionist } from '../../fixtures/actors';

describe('RF-301 — Apertura de Turno de Caja con Fondo Inicial', () => {
  const service = new CashService();
  const actorRec = receptionist('req-cash-01');

  it('abre un turno de caja con fondo inicial en efectivo', async () => {
    const shift = await service.openShift({
      branchId: 'branch-cash-01',
      initialFloat: 500,
    }, actorRec);

    expect(shift.id).toBeDefined();
    expect(shift.status).toBe('open');
    expect(shift.initialFloat).toBe(500);
    expect(shift.expensesTotal).toBe(0);
    expect(shift.cashierId).toBe(actorRec.actorId);
  });

  it('impide abrir dos turnos simultáneos en la misma sucursal', async () => {
    await expect(
      service.openShift({
        branchId: 'branch-cash-01',
        initialFloat: 300,
      }, actorRec)
    ).rejects.toThrow(/turno activo|ya existe/i);
  });

  it('rechaza apertura de turno con fondo negativo', async () => {
    await expect(
      service.openShift({
        branchId: 'branch-cash-02',
        initialFloat: -100,
      }, actorRec)
    ).rejects.toThrow(/fondo inicial|positivo/i);
  });
});
