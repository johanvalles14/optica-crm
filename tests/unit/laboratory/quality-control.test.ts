import { describe, it, expect } from 'vitest';
import { LaboratoryService } from '../../../src/modules/laboratory/service';
import { salesService } from '../../../src/lib/services';
import { labTechnician, receptionist } from '../../fixtures/actors';

describe('RF-205 — Control de Calidad en 1 Clic', () => {
  const labService = new LaboratoryService();
  const actorLab = labTechnician('req-lab-qc-01');
  const actorRec = receptionist('req-rec-qc-01');

  it('aprueba calidad en 1 clic y transiciona automáticamente la orden de mostrador a ready_for_delivery', async () => {
    // 1. Crear una orden de venta previa en mostrador
    const saleOrder = await salesService.createOrder({
      branchId: 'branch-001',
      patientName: 'Mariana Garza',
      items: [
        {
          itemType: 'lens_complete',
          description: 'Lentes terminados monofocales',
          quantity: 1,
          unitPrice: 1200,
        },
      ],
      initialPayment: { amount: 600, method: 'cash' },
    }, actorRec);

    expect(saleOrder.status).toBe('confirmed_in_process');

    // 2. Crear la orden de taller asociada
    const labOrder = await labService.createOrder({
      saleOrderId: saleOrder.id,
      saleOrderFolio: saleOrder.folio,
      branchId: 'branch-001',
      patientName: saleOrder.patientName!,
      frameCode: 'ARM-0001',
      lensMaterial: 'CR-39',
      rightEye: { sphere: -1.0, pupillaryDistance: 32 },
      leftEye: { sphere: -1.25, pupillaryDistance: 32 },
    }, actorLab);

    expect(labOrder.status).toBe('queued');

    // 3. Montador aprueba control de calidad en 1 clic
    const approvedLab = await labService.approveQuality(labOrder.id, labOrder.version, actorLab);

    expect(approvedLab.status).toBe('completed');
    expect(approvedLab.qualityApprovedAt).toBeDefined();
    expect(approvedLab.qualityApprovedBy).toBe(actorLab.actorId);

    // 4. Verificar que la orden de venta en mostrador se actualizó automáticamente
    const updatedSale = await salesService.getOrder(saleOrder.id, actorRec);
    expect(updatedSale?.status).toBe('ready_for_delivery');
  });
});
