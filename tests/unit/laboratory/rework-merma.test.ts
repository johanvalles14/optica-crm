import { describe, it, expect } from 'vitest';
import { LaboratoryService } from '../../../src/modules/laboratory/service';
import { salesService, inventoryService } from '../../../src/lib/services';
import { labTechnician, receptionist, inventoryManager } from '../../fixtures/actors';

describe('RF-206 — Merma Estricta en Taller y Alerta en Mostrador', () => {
  const labService = new LaboratoryService();
  const actorLab = labTechnician('req-lab-rw-01');
  const actorRec = receptionist('req-rec-rw-01');
  const actorInv = inventoryManager('req-inv-rw-01');

  it('registra rotura de mica/armazón, descuenta stock y marca alerta en mostrador', async () => {
    // 1. Dar de alta un armazón de prueba
    const [testFrame] = await inventoryService.quickBatchIntake({
      category: 'frame',
      brand: 'Prueba Taller Rotura',
      retailPrice: 900,
      quantity: 1,
      branchId: 'branch-001',
    }, actorInv);

    expect(testFrame.stock).toBe(1);

    // 2. Crear venta
    const saleOrder = await salesService.createOrder({
      branchId: 'branch-001',
      patientName: 'David H.',
      items: [{ itemType: 'frame', description: testFrame.internalCode, quantity: 1, unitPrice: 900 }],
      initialPayment: { amount: 500, method: 'cash' },
    }, actorRec);

    // 3. Crear orden de taller
    const labOrder = await labService.createOrder({
      saleOrderId: saleOrder.id,
      saleOrderFolio: saleOrder.folio,
      branchId: 'branch-001',
      patientName: 'David H.',
      frameCode: testFrame.internalCode,
      lensMaterial: 'CR-39',
      rightEye: { sphere: -2.0 },
      leftEye: { sphere: -2.0 },
    }, actorLab);

    // 4. Reportar rotura en biselado
    const reworked = await labService.reportRework({
      labOrderId: labOrder.id,
      reason: 'Mica izquierda astillada durante biselado manual',
      brokenProductId: testFrame.id,
      brokenQuantity: 1,
      additionalDeliveryDays: 2,
      expectedVersion: labOrder.version,
    }, actorLab);

    expect(reworked.status).toBe('rework_needed');
    expect(reworked.reworkReason).toContain('Mica izquierda astillada');

    // 5. Verificar que la orden de venta en mostrador refleja la alerta de repetición
    const updatedSale = await salesService.getOrder(saleOrder.id, actorRec);
    expect(updatedSale?.notes).toContain('REPETICIÓN / MERMA');
  });
});
