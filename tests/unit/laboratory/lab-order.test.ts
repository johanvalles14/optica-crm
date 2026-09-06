import { describe, it, expect } from 'vitest';
import { LaboratoryService } from '../../../src/modules/laboratory/service';
import { labTechnician, receptionist } from '../../fixtures/actors';

describe('RF-201, RF-202, RF-203 — Ficha Técnica y Asignación de Taller / Maquila', () => {
  const service = new LaboratoryService();
  const actorLab = labTechnician('req-lab-01');

  it('crea orden de laboratorio con folio correlativo y receta completa', async () => {
    const labOrder = await service.createOrder({
      saleOrderId: 'sale-demo-001',
      saleOrderFolio: 'VTA-0010',
      branchId: 'branch-001',
      patientName: 'Enrique Segoviano',
      frameCode: 'ARM-0001',
      frameMountingType: 'full_rim',
      lensMaterial: 'Policarbonato',
      treatments: ['Antirreflejante', 'Filtro Azul'],
      rightEye: { sphere: -2.0, cylinder: -0.5, axis: 180, pupillaryDistance: 31, opticalCenterHeight: 18 },
      leftEye: { sphere: -1.75, cylinder: -0.75, axis: 175, pupillaryDistance: 31, opticalCenterHeight: 18 },
    }, actorLab);

    expect(labOrder.folio).toMatch(/^LAB-[0-9]{4,}$/);
    expect(labOrder.status).toBe('queued');
    expect(labOrder.destination).toBe('internal_workshop');
    expect(labOrder.rightEye.sphere).toBe(-2.0);
    expect(labOrder.rightEye.pupillaryDistance).toBe(31);
    expect(labOrder.treatments).toContain('Filtro Azul');
  });

  it('permite reasignar destino a maquila externa con proveedor y fecha estimada', async () => {
    const labOrder = await service.createOrder({
      saleOrderId: 'sale-demo-002',
      saleOrderFolio: 'VTA-0011',
      branchId: 'branch-001',
      patientName: 'Sofía Reyes',
      frameCode: 'ARM-0002',
      lensMaterial: 'Alto Índice 1.67',
      rightEye: { sphere: -6.5, pupillaryDistance: 30 },
      leftEye: { sphere: -6.0, pupillaryDistance: 30 },
    }, actorLab);

    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 5);

    const updated = await service.assignDestination({
      labOrderId: labOrder.id,
      destination: 'external_lab',
      externalLabName: 'Laboratorio Azteca',
      externalGuideNumber: 'GUIA-889977',
      expectedReturnDate: returnDate,
      expectedVersion: labOrder.version,
    }, actorLab);

    expect(updated.destination).toBe('external_lab');
    expect(updated.externalLabName).toBe('Laboratorio Azteca');
    expect(updated.externalGuideNumber).toBe('GUIA-889977');
    expect(updated.status).toBe('in_process');
  });
});
