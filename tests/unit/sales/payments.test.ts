import { describe, it, expect } from 'vitest';
import { SalesService } from '../../../src/modules/sales/service';
import { receptionist } from '../../fixtures/actors';

describe('RF-106, RF-107 — Control de Anticipos, Saldos y Liquidación', () => {
  const service = new SalesService();
  const actorRec = receptionist('req-sale-01');

  it('crea orden con anticipo, calcula saldo pendiente y transiciona a confirmed_in_process', async () => {
    const order = await service.createOrder({
      branchId: 'branch-001',
      patientName: 'Roberto Gómez',
      items: [
        {
          itemType: 'frame',
          description: 'Armazón Carey Modelo 12',
          quantity: 1,
          unitPrice: 900,
        },
        {
          itemType: 'lens_complete',
          description: 'Micas Policarbonato con Antirreflejante',
          quantity: 1,
          unitPrice: 650,
        },
      ],
      initialPayment: {
        amount: 500,
        method: 'cash',
      },
    }, actorRec);

    expect(order.folio).toMatch(/^VTA-[0-9]{4,}$/);
    expect(order.total).toBe(1550);
    expect(order.paidAmount).toBe(500);
    expect(order.balanceDue).toBe(1050);
    expect(order.status).toBe('confirmed_in_process');
    expect(order.payments).toHaveLength(1);
    expect(order.payments[0].amount).toBe(500);
  });

  it('rechaza entregar los lentes si queda saldo pendiente y no se aporta pago de liquidación', async () => {
    const order = await service.createOrder({
      branchId: 'branch-001',
      items: [
        {
          itemType: 'accessory',
          description: 'Solución Lentes 240ml',
          quantity: 1,
          unitPrice: 200,
        },
      ],
      // Sin pago inicial
    }, actorRec);

    expect(order.balanceDue).toBe(200);
    const ready = await service.markReadyForDelivery(order.id, order.version, actorRec);

    // Intento de entrega sin liquidar
    await expect(
      service.deliverAndClose(ready.id, undefined, ready.version, actorRec)
    ).rejects.toThrow(/saldo pendiente|liquidaci[oó]n/i);
  });

  it('liquida saldo al entregar y transiciona orden a delivered_paid', async () => {
    const order = await service.createOrder({
      branchId: 'branch-001',
      items: [
        {
          itemType: 'accessory',
          description: 'Estuche Rígido Reforzado',
          quantity: 1,
          unitPrice: 150,
        },
      ],
    }, actorRec);

    const ready = await service.markReadyForDelivery(order.id, order.version, actorRec);

    const delivered = await service.deliverAndClose(
      ready.id,
      { amount: 150, method: 'card_debit' },
      ready.version,
      actorRec
    );

    expect(delivered.status).toBe('delivered_paid');
    expect(delivered.balanceDue).toBe(0);
    expect(delivered.paidAmount).toBe(150);
    expect(delivered.deliveredAt).toBeDefined();
  });
});
