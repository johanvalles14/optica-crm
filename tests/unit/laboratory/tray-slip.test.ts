import { describe, it, expect } from 'vitest';
import { LaboratoryService } from '../../../src/modules/laboratory/service';
import { labTechnician } from '../../fixtures/actors';

describe('RF-204 — Boleta de Charola Imprimible', () => {
  const service = new LaboratoryService();
  const actorLab = labTechnician('req-lab-slip-01');

  it('genera estructura de boleta de charola con receta y montaje', async () => {
    const labOrder = await service.createOrder({
      saleOrderId: 'sale-tray-001',
      saleOrderFolio: 'VTA-0088',
      branchId: 'branch-001',
      patientName: 'Verónica Castro',
      frameCode: 'ARM-0012',
      frameMountingType: 'semi_rimless_groove',
      lensMaterial: 'Policarbonato',
      treatments: ['Antirreflejante'],
      rightEye: { sphere: -3.0, cylinder: -1.0, axis: 90, pupillaryDistance: 31.5 },
      leftEye: { sphere: -3.25, cylinder: -0.75, axis: 85, pupillaryDistance: 31.5 },
      observations: 'Bisel ranurado con hilo de nylon transparente',
    }, actorLab);

    const slip = await service.getTraySlip(labOrder.id, actorLab);
    expect(slip.labOrderFolio).toBe(labOrder.folio);
    expect(slip.saleOrderFolio).toBe('VTA-0088');
    expect(slip.patientName).toBe('Verónica Castro');
    expect(slip.frameCode).toBe('ARM-0012');
    expect(slip.frameMountingType).toContain('Ranurado');
    expect(slip.rightEye.sphere).toBe(-3.0);
    expect(slip.observations).toContain('Bisel ranurado');
  });
});
