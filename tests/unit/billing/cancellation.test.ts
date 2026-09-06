import { describe, it, expect } from 'vitest';
import { BillingService } from '../../../src/modules/billing/service';
import { salesService } from '../../../src/lib/services';
import { receptionist, admin } from '../../fixtures/actors';

describe('RF-407 — Cancelación Formal de CFDI ante el SAT', () => {
  const billingService = new BillingService();
  const actorRec = receptionist('req-cancel-01');
  const actorAdm = admin('req-cancel-adm-01');

  it('permite a un administrador cancelar un CFDI con motivo oficial del SAT', async () => {
    const saleOrder = await salesService.createOrder({
      branchId: 'branch-001',
      patientName: 'Prueba Cancelación',
      items: [{ itemType: 'accessory', description: 'Estuche', quantity: 1, unitPrice: 300 }],
      initialPayment: { amount: 300, method: 'cash' },
    }, actorRec);

    const invoice = await billingService.issueInvoice({
      saleOrderId: saleOrder.id,
      taxProfile: {
        rfc: 'VAPJ850906HR7',
        legalName: 'JUAN PEREZ',
        zipCode: '27000',
        taxSystem: '605',
        cfdiUse: 'D07',
      },
    }, actorRec);

    expect(invoice.status).toBe('issued');

    // Cancelación con motivo 02 (Comprobante emitido con errores sin relación)
    const cancelled = await billingService.cancelInvoice({
      invoiceId: invoice.id,
      motive: '02',
      expectedVersion: invoice.version,
    }, actorAdm);

    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancellationMotive).toBe('02');
    expect(cancelled.cancelledAt).toBeDefined();
  });

  it('rechaza cancelación de CFDI si la ejecuta un rol sin privilegios (receptionist)', async () => {
    const saleOrder = await salesService.createOrder({
      branchId: 'branch-001',
      patientName: 'Prueba Sin Permiso',
      items: [{ itemType: 'accessory', description: 'Cordón', quantity: 1, unitPrice: 100 }],
      initialPayment: { amount: 100, method: 'cash' },
    }, actorRec);

    const invoice = await billingService.issueInvoice({
      saleOrderId: saleOrder.id,
      taxProfile: {
        rfc: 'VAPJ850906HR7',
        legalName: 'JUAN PEREZ',
        zipCode: '27000',
        taxSystem: '605',
      },
    }, actorRec);

    await expect(
      billingService.cancelInvoice({
        invoiceId: invoice.id,
        motive: '02',
        expectedVersion: invoice.version,
      }, actorRec)
    ).rejects.toThrow(/permission denied|autorizado/i);
  });
});
