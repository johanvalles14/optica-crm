import { describe, it, expect } from 'vitest';
import { BillingService } from '../../../src/modules/billing/service';
import { salesService } from '../../../src/lib/services';
import { receptionist } from '../../fixtures/actors';

describe('RF-404, RF-405 — Timbrado de Factura CFDI 4.0 con PAC', () => {
  const billingService = new BillingService();
  const actorRec = receptionist('req-bill-01');

  it('timbra factura electrónica para una venta liquidada y obtiene UUID del SAT', async () => {
    // 1. Crear una venta de prueba liquidada
    const saleOrder = await salesService.createOrder({
      branchId: 'branch-001',
      patientName: 'Guillermo Arriaga',
      items: [
        {
          itemType: 'lens_complete',
          description: 'Lentes oftálmicos graduados antirreflejante',
          quantity: 1,
          unitPrice: 1500,
        },
      ],
      initialPayment: { amount: 1500, method: 'transfer' },
    }, actorRec);

    // 2. Timbrar factura express
    const invoice = await billingService.issueInvoice({
      saleOrderId: saleOrder.id,
      taxProfile: {
        rfc: 'AAGG750315AA2',
        legalName: 'GUILLERMO ARRIAGA',
        zipCode: '27000',
        taxSystem: '605',
        cfdiUse: 'D07',
      },
    }, actorRec);

    expect(invoice.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(invoice.folio).toMatch(/^FAC-[0-9]{4,}$/);
    expect(invoice.status).toBe('issued');
    expect(invoice.paymentFormSat).toBe('03'); // Transferencia
    expect(invoice.total).toBe(1500);
    expect(invoice.xmlContent).toContain('cfdi:Comprobante');
    expect(invoice.xmlContent).toContain('ClaveProdServ="42142900"'); // Clave SAT lentes
  });

  it('rechaza emitir segunda factura para una orden ya facturada', async () => {
    // Crear venta
    const saleOrder = await salesService.createOrder({
      branchId: 'branch-001',
      patientName: 'Prueba Doble Factura',
      items: [{ itemType: 'accessory', description: 'Gafas', quantity: 1, unitPrice: 500 }],
      initialPayment: { amount: 500, method: 'cash' },
    }, actorRec);

    // Primera factura
    await billingService.issueInvoice({
      saleOrderId: saleOrder.id,
      taxProfile: {
        rfc: 'XAXX010101000',
        legalName: 'PUBLICO EN GENERAL',
        zipCode: '27000',
        taxSystem: '616',
        cfdiUse: 'S01',
      },
    }, actorRec);

    // Intento de segunda factura
    await expect(
      billingService.issueInvoice({
        saleOrderId: saleOrder.id,
        taxProfile: {
          rfc: 'XAXX010101000',
          legalName: 'PUBLICO EN GENERAL',
          zipCode: '27000',
          taxSystem: '616',
        },
      }, actorRec)
    ).rejects.toThrow(/ya ha sido facturada|duplicad/i);
  });
});
