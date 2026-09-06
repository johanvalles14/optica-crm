import { describe, it, expect } from 'vitest';
import { CashService } from '../../../src/modules/cash/service';
import { salesService } from '../../../src/lib/services';
import { receptionist } from '../../fixtures/actors';

describe('RF-306 — Reporte de Saldos en la Calle (Cuentas por Cobrar)', () => {
  const cashService = new CashService();
  const actorRec = receptionist('req-cash-ar-01');

  it('reporta el saldo pendiente acumulado de todas las órdenes en proceso', async () => {
    // 1. Crear una orden con saldo pendiente de $700
    await salesService.createOrder({
      branchId: 'branch-ar-01',
      patientName: 'Paciente Pendiente 1',
      items: [{ itemType: 'accessory', description: 'Lente 1', quantity: 1, unitPrice: 1000 }],
      initialPayment: { amount: 300, method: 'cash' },
    }, actorRec);

    // 2. Crear otra orden con saldo pendiente de $400
    await salesService.createOrder({
      branchId: 'branch-ar-01',
      patientName: 'Paciente Pendiente 2',
      items: [{ itemType: 'accessory', description: 'Lente 2', quantity: 1, unitPrice: 600 }],
      initialPayment: { amount: 200, method: 'card_debit' },
    }, actorRec);

    // 3. Consultar reporte de saldos en la calle
    const report = await cashService.getAccountsReceivable('branch-ar-01', actorRec);

    expect(report.totalOrdersWithBalance).toBeGreaterThanOrEqual(2);
    expect(report.totalOutstandingBalance).toBeGreaterThanOrEqual(1100);
    const item1 = report.items.find((i) => i.patientName === 'Paciente Pendiente 1');
    expect(item1?.balanceDue).toBe(700);
  });
});
