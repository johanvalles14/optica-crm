import { describe, it, expect } from 'vitest';
import { CashService } from '../../../src/modules/cash/service';
import { salesService } from '../../../src/lib/services';
import { receptionist } from '../../fixtures/actors';

describe('RF-303, RF-304, RF-305 — Arqueo Ciego y Corte Diario', () => {
  const cashService = new CashService();
  const actorRec = receptionist('req-cash-audit-01');

  it('calcula exacto el efectivo esperado, procesa arqueo ciego y detecta faltante', async () => {
    // 1. Abrir turno con $500 de fondo inicial
    const shift = await cashService.openShift({
      branchId: 'branch-audit-01',
      initialFloat: 500,
    }, actorRec);

    // 2. Simular venta con anticipo en efectivo de $800
    await salesService.createOrder({
      branchId: 'branch-audit-01',
      patientName: 'Cliente Efectivo',
      items: [{ itemType: 'accessory', description: 'Gafas de sol', quantity: 1, unitPrice: 800 }],
      initialPayment: { amount: 800, method: 'cash' },
    }, actorRec);

    // 3. Simular venta con pago en tarjeta de $600
    await salesService.createOrder({
      branchId: 'branch-audit-01',
      patientName: 'Cliente Tarjeta',
      items: [{ itemType: 'accessory', description: 'Lente de contacto', quantity: 1, unitPrice: 600 }],
      initialPayment: { amount: 600, method: 'card_debit' },
    }, actorRec);

    // 4. Registrar gasto menor de caja chica de $50
    await cashService.recordExpense({
      shiftId: shift.id,
      amount: 50,
      description: 'Papelería y clips',
    }, actorRec);

    // Efectivo esperado = Fondo (500) + Cobros Efectivo (800) - Gastos (50) = $1,250
    // Tarjeta esperada = $600

    // 5. Arqueo ciego: cajera cuenta físicamente $1,200 en el cajón (faltan $50)
    const currentShift = await cashService.getShift(shift.id, actorRec);
    const closedShift = await cashService.closeShift({
      shiftId: shift.id,
      declaredCash: 1200,
      notes: 'Faltante de $50 por error de cambio en mostrador',
      expectedVersion: currentShift!.version,
    }, actorRec);

    expect(closedShift.status).toBe('closed');
    expect(closedShift.expectedCash).toBe(1250);
    expect(closedShift.declaredCash).toBe(1200);
    expect(closedShift.cashDifference).toBe(-50); // Faltante
    expect(closedShift.cardTotal).toBe(600);
    expect(closedShift.notes).toContain('Faltante');
    expect(closedShift.closedAt).toBeDefined();
  });

  it('cierra cuadrado sin diferencia cuando el efectivo declarado coincide al centavo', async () => {
    const shift = await cashService.openShift({
      branchId: 'branch-audit-02',
      initialFloat: 300,
    }, actorRec);

    // Venta de $200 en efectivo
    await salesService.createOrder({
      branchId: 'branch-audit-02',
      patientName: 'Cliente 2',
      items: [{ itemType: 'accessory', description: 'Gotas', quantity: 1, unitPrice: 200 }],
      initialPayment: { amount: 200, method: 'cash' },
    }, actorRec);

    // Esperado = 300 + 200 = $500
    const closed = await cashService.closeShift({
      shiftId: shift.id,
      declaredCash: 500,
      expectedVersion: shift.version,
    }, actorRec);

    expect(closed.cashDifference).toBe(0);
    expect(closed.status).toBe('closed');
  });
});
