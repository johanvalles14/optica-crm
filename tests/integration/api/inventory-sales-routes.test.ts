import { describe, it, expect } from 'vitest';
import { POST as postIntake } from '../../../src/app/api/inventory/intake/route';
import { GET as getProducts } from '../../../src/app/api/inventory/products/route';
import { POST as postAdjustment } from '../../../src/app/api/inventory/adjustments/route';
import { POST as postOrder } from '../../../src/app/api/sales/orders/route';
import { POST as postPayment } from '../../../src/app/api/sales/orders/[id]/payments/route';

describe('T112, T113 — API Routes de Inventario y Ventas (SPEC-002)', () => {
  it('POST /api/inventory/intake genera lote con códigos en serie', async () => {
    const req = new Request('http://localhost/api/inventory/intake', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'inventory:manager',
      },
      body: JSON.stringify({
        category: 'frame',
        brand: 'Embarque Rápido',
        retailPrice: 950,
        quantity: 3,
        branchId: 'branch-001',
      }),
    });

    const res = await postIntake(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.products).toHaveLength(3);
    expect(data.products[0].internalCode).toMatch(/^ARM-/);
  });

  it('GET /api/inventory/products oculta costo al mostrador (frontdesk)', async () => {
    const req = new Request('http://localhost/api/inventory/products?category=frame', {
      headers: {
        'x-demo-role': 'frontdesk:receptionist',
      },
    });

    const res = await getProducts(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.products.length).toBeGreaterThan(0);
    for (const p of data.products) {
      expect(p.costPrice).toBeUndefined();
    }
  });

  it('POST /api/inventory/adjustments descuenta stock por merma/rotura', async () => {
    // Tomamos prod-003 del seed
    const req = new Request('http://localhost/api/inventory/adjustments', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'inventory:manager',
      },
      body: JSON.stringify({
        productId: 'prod-003',
        quantity: -1,
        reason: 'damage_breakage',
        notes: 'Frasco roto en mostrador',
      }),
    });

    const res = await postAdjustment(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.movement.reason).toBe('damage_breakage');
    expect(data.movement.quantityChange).toBe(-1);
  });

  it('POST /api/sales/orders y POST .../payments crea venta con anticipo y registra liquidación', async () => {
    const reqOrder = new Request('http://localhost/api/sales/orders', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'frontdesk:receptionist',
      },
      body: JSON.stringify({
        branchId: 'branch-001',
        patientName: 'Lucía Méndez',
        items: [
          {
            itemType: 'accessory',
            description: 'Paño microfibra premium',
            quantity: 2,
            unitPrice: 50,
          },
        ],
        initialPayment: {
          amount: 40,
          method: 'cash',
        },
      }),
    });

    const resOrder = await postOrder(reqOrder);
    expect(resOrder.status).toBe(201);
    const dataOrder = await resOrder.json();
    expect(dataOrder.order.folio).toMatch(/^VTA-/);
    expect(dataOrder.order.total).toBe(100);
    expect(dataOrder.order.paidAmount).toBe(40);
    expect(dataOrder.order.balanceDue).toBe(60);

    // Registrar pago restante
    const reqPay = new Request(`http://localhost/api/sales/orders/${dataOrder.order.id}/payments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'frontdesk:receptionist',
      },
      body: JSON.stringify({
        amount: 60,
        method: 'card_debit',
      }),
    });

    const resPay = await postPayment(reqPay, { params: Promise.resolve({ id: dataOrder.order.id }) });
    expect(resPay.status).toBe(201);
    const dataPay = await resPay.json();
    expect(dataPay.order.balanceDue).toBe(0);
    expect(dataPay.order.paidAmount).toBe(100);
  });
});
