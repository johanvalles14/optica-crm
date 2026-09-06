import { describe, it, expect } from 'vitest';
import { POST as postLabOrder, GET as getLabOrders } from '../../../src/app/api/laboratory/orders/route';
import { GET as getLabDetail, PATCH as patchLabOrder } from '../../../src/app/api/laboratory/orders/[id]/route';
import { POST as postApproveQuality } from '../../../src/app/api/laboratory/orders/[id]/approve/route';
import { POST as postRework } from '../../../src/app/api/laboratory/orders/[id]/rework/route';
import { GET as getTraySlip } from '../../../src/app/api/laboratory/orders/[id]/slip/route';

describe('T209..T212 — API Routes de Taller y Laboratorio (SPEC-003)', () => {
  let createdLabOrderId = '';

  it('POST /api/laboratory/orders crea orden de taller', async () => {
    const req = new Request('http://localhost/api/laboratory/orders', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'laboratory:technician',
      },
      body: JSON.stringify({
        saleOrderId: 'sale-api-test-01',
        saleOrderFolio: 'VTA-0999',
        branchId: 'branch-001',
        patientName: 'Lorena Herrera',
        frameCode: 'ARM-0001',
        frameMountingType: 'full_rim',
        lensMaterial: 'CR-39',
        treatments: ['Antirreflejante'],
        rightEye: { sphere: -1.5, pupillaryDistance: 31 },
        leftEye: { sphere: -1.5, pupillaryDistance: 31 },
      }),
    });

    const res = await postLabOrder(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.order.folio).toMatch(/^LAB-/);
    expect(data.order.status).toBe('queued');
    createdLabOrderId = data.order.id;
  });

  it('PATCH /api/laboratory/orders/[id] asigna maquila externa', async () => {
    const req = new Request(`http://localhost/api/laboratory/orders/${createdLabOrderId}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'laboratory:technician',
      },
      body: JSON.stringify({
        action: 'assignDestination',
        destination: 'external_lab',
        externalLabName: 'Laboratorio Toluca',
        externalGuideNumber: 'FEDEX-12345',
        expectedVersion: 1,
      }),
    });

    const res = await patchLabOrder(req, { params: Promise.resolve({ id: createdLabOrderId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.order.destination).toBe('external_lab');
    expect(data.order.externalLabName).toBe('Laboratorio Toluca');
    expect(data.order.status).toBe('in_process');
  });

  it('GET /api/laboratory/orders/[id]/slip devuelve boleta de charola', async () => {
    const req = new Request(`http://localhost/api/laboratory/orders/${createdLabOrderId}/slip`, {
      headers: { 'x-demo-role': 'laboratory:technician' },
    });

    const res = await getTraySlip(req, { params: Promise.resolve({ id: createdLabOrderId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.slip.patientName).toBe('Lorena Herrera');
    expect(data.slip.frameCode).toBe('ARM-0001');
    expect(data.slip.rightEye.sphere).toBe(-1.5);
  });

  it('POST /api/laboratory/orders/[id]/rework reporta rotura y pasa a rework_needed', async () => {
    const req = new Request(`http://localhost/api/laboratory/orders/${createdLabOrderId}/rework`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'laboratory:technician',
      },
      body: JSON.stringify({
        reason: 'Mica OD quebrada en desbaste',
        additionalDeliveryDays: 2,
        expectedVersion: 2,
      }),
    });

    const res = await postRework(req, { params: Promise.resolve({ id: createdLabOrderId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.order.status).toBe('rework_needed');
    expect(data.order.reworkReason).toContain('Mica OD quebrada');
  });

  it('POST /api/laboratory/orders/[id]/approve aprueba calidad en 1 clic', async () => {
    const req = new Request(`http://localhost/api/laboratory/orders/${createdLabOrderId}/approve`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'laboratory:technician',
      },
      body: JSON.stringify({ expectedVersion: 3 }),
    });

    const res = await postApproveQuality(req, { params: Promise.resolve({ id: createdLabOrderId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.order.status).toBe('completed');
    expect(data.readyForDelivery).toBe(true);
  });
});
