import { describe, it, expect } from 'vitest';
import { POST as postInvoice, GET as getInvoices } from '../../../src/app/api/billing/invoices/route';
import { GET as getInvoiceDetail, DELETE as deleteInvoice } from '../../../src/app/api/billing/invoices/[id]/route';
import { GET as getInvoiceXml } from '../../../src/app/api/billing/invoices/[id]/xml/route';
import { POST as postOrder } from '../../../src/app/api/sales/orders/route';

describe('T409..T411 — API Routes de Facturación CFDI 4.0 (SPEC-005)', () => {
  let createdInvoiceId = '';
  let testSaleOrderId = '';

  it('emite factura fiscal CFDI 4.0 para una venta liquidada', async () => {
    // 1. Crear venta
    const orderReq = new Request('http://localhost/api/sales/orders', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'frontdesk:receptionist',
      },
      body: JSON.stringify({
        branchId: 'branch-001',
        patientName: 'Fernando del Paso',
        items: [{ itemType: 'accessory', description: 'Gafas polarizadas', quantity: 1, unitPrice: 2000 }],
        initialPayment: { amount: 2000, method: 'card_credit' },
      }),
    });
    const orderRes = await postOrder(orderReq);
    const orderData = await orderRes.json();
    testSaleOrderId = orderData.order.id;

    // 2. Emitir factura express
    const invReq = new Request('http://localhost/api/billing/invoices', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'frontdesk:receptionist',
      },
      body: JSON.stringify({
        saleOrderId: testSaleOrderId,
        taxProfile: {
          rfc: 'FDP350401AA9',
          legalName: 'FERNANDO DEL PASO',
          zipCode: '27000',
          taxSystem: '605',
          cfdiUse: 'D07',
        },
      }),
    });

    const invRes = await postInvoice(invReq);
    expect(invRes.status).toBe(201);
    const invData = await invRes.json();
    expect(invData.invoice.folio).toMatch(/^FAC-/);
    expect(invData.invoice.uuid).toBeDefined();
    expect(invData.invoice.paymentFormSat).toBe('04'); // Tarjeta de crédito
    createdInvoiceId = invData.invoice.id;
  });

  it('GET /api/billing/invoices lista las facturas emitidas', async () => {
    const req = new Request('http://localhost/api/billing/invoices', {
      headers: { 'x-demo-role': 'frontdesk:receptionist' },
    });
    const res = await getInvoices(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.invoices.length).toBeGreaterThan(0);
    expect(data.invoices.some((i: any) => i.id === createdInvoiceId)).toBe(true);
  });

  it('GET /api/billing/invoices/[id]/xml devuelve el archivo XML sellado con cabecera application/xml', async () => {
    const req = new Request(`http://localhost/api/billing/invoices/${createdInvoiceId}/xml`, {
      headers: { 'x-demo-role': 'frontdesk:receptionist' },
    });
    const res = await getInvoiceXml(req, { params: Promise.resolve({ id: createdInvoiceId }) });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/xml');
    const xml = await res.text();
    expect(xml).toContain('cfdi:Comprobante');
    expect(xml).toContain('ClaveProdServ="42142900"');
  });

  it('DELETE /api/billing/invoices/[id] cancela la factura ante el SAT con motivo oficial', async () => {
    const req = new Request(`http://localhost/api/billing/invoices/${createdInvoiceId}`, {
      method: 'DELETE',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'admin',
      },
      body: JSON.stringify({
        motive: '02',
        expectedVersion: 1,
      }),
    });

    const res = await deleteInvoice(req, { params: Promise.resolve({ id: createdInvoiceId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.invoice.status).toBe('cancelled');
    expect(data.invoice.cancellationMotive).toBe('02');
    expect(data.cancelled).toBe(true);
  });
});
