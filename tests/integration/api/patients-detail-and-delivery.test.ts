import { describe, it, expect } from 'vitest';
import { GET as getPatientDetail } from '../../../src/app/api/patients/[id]/route';
import { POST as postDelivery } from '../../../src/app/api/sales/orders/[id]/deliver/route';
import { POST as postSaleOrder } from '../../../src/app/api/sales/orders/route';

describe('Rediseño UI & Flujos Esenciales — Endpoints de Detalle y Entrega', () => {
  it('GET /api/patients/[id] responde con expediente o 404', async () => {
    const req = new Request('http://localhost/api/patients/PT000001');
    const res = await getPatientDetail(req, {
      params: Promise.resolve({ id: 'PT000001' }),
    });

    // En memoria o DB, responde con el objeto de paciente o 404 si no existe
    expect([200, 404]).toContain(res.status);
    const data = await res.json();
    if (res.status === 200) {
      expect(data.patient).toBeDefined();
    }
  });

  it('POST /api/sales/orders/[id]/deliver procesa liquidación y entrega de lentes', async () => {
    // 1. Crear una orden primero
    const createReq = new Request('http://localhost/api/sales/orders', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'frontdesk:receptionist',
        'x-actor-id': 'user-rec-001',
      },
      body: JSON.stringify({
        branchId: 'branch-001',
        patientName: 'Prueba Entrega',
        items: [
          {
            itemType: 'frame',
            description: 'Armazón Prueba',
            quantity: 1,
            unitPrice: 500,
          },
        ],
        initialPayment: {
          amount: 200,
          method: 'cash',
        },
      }),
    });

    const createRes = await postSaleOrder(createReq);
    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    const orderId = createData.order.id;

    // 2. Entregar y liquidar el saldo restante ($300)
    const deliverReq = new Request(`http://localhost/api/sales/orders/${orderId}/deliver`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'frontdesk:receptionist',
        'x-actor-id': 'user-rec-001',
      },
      body: JSON.stringify({
        finalPayment: {
          amount: 300,
          method: 'cash',
        },
        expectedVersion: createData.order.version,
      }),
    });

    const deliverRes = await postDelivery(deliverReq, {
      params: Promise.resolve({ id: orderId }),
    });

    expect(deliverRes.status).toBe(200);
    const deliverData = await deliverRes.json();
    expect(deliverData.order.status).toBe('delivered_paid');
    expect(deliverData.order.balanceDue).toBe(0);
    expect(deliverData.order.paidAmount).toBe(500);
  });
});
