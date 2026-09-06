import { describe, it, expect } from 'vitest';
import { ClinicalService } from '../../../src/modules/clinical/service';
import { optometrist } from '../../fixtures/actors';
import { validUsage } from '../../fixtures/refractions';

describe('RF-011 — Enmiendas de refracción y prescripción', () => {
  const service = new ClinicalService();

  it('enmienda de refracción crea nuevo registro sin borrar el original', async () => {
    const amended = await service.amendRefraction(
      {
        consultationId: 'consultation-amend',
        eye: 'OD',
        sphere: -3,
        cylinder: -1,
        axis: 180,
        amendedFromId: 'ref-od-original',
        amendmentReason: 'Corrección de eje',
        expectedVersion: 2,
      },
      optometrist('req-amend-ref-001')
    );

    expect(amended.isAmendment).toBe(true);
    expect(amended.amendedFromId).toBe('ref-od-original');
    expect(amended.amendmentReason).toBe('Corrección de eje');
  });

  it('enmienda de prescripción conserva la prescripción base inmutable', async () => {
    const amended = await service.amendPrescription(
      {
        prescriptionId: 'prescription-base-001',
        usage: validUsage,
        observations: 'Ajuste de montaje',
        amendmentReason: 'Corrección post-entrega',
        expectedVersion: 1,
      },
      optometrist('req-amend-rx-001')
    );

    expect(amended.isAmendment).toBe(true);
    expect(amended.amendedFromId).toBe('prescription-base-001');
    expect(amended.version).toBe(2);
  });
});
