import { describe, it, expect } from 'vitest';
import { PrescriptionService } from '../../../src/modules/clinical/prescription.service';
import { optometrist } from '../../fixtures/actors';
import { validUsage } from '../../fixtures/refractions';

describe('RF-008 — Prescripción con snapshot de refracción', () => {
  const service = new PrescriptionService();

  it('emite prescripción con folio correlativo y versión inicial 1', async () => {
    const prescription = await service.issuePrescription(
      { consultationId: 'consultation-rx', usage: validUsage, expectedVersion: 2 },
      optometrist('req-rx-001')
    );

    expect(prescription.folio).toMatch(/^[A-Z0-9]{8}$/);
    expect(prescription.version).toBe(1);
    expect(prescription.issuedBy).toBe('user-opt-001');
  });

  it('almacena snapshot inmutable de refracción OD/OI con source ids', async () => {
    const prescription = await service.issuePrescription(
      { consultationId: 'consultation-rx', usage: validUsage, expectedVersion: 2 },
      optometrist('req-rx-002')
    );

    expect(prescription.rightEyeSnapshot).toBeDefined();
    expect(prescription.leftEyeSnapshot).toBeDefined();
    expect(prescription.rightEyeSnapshot.eye).toBe('OD');
    expect(prescription.leftEyeSnapshot.eye).toBe('OI');
    expect(prescription.snapshotSourceIds).toHaveLength(2);
    expect(prescription.snapshotTakenAt).toBeInstanceOf(Date);
  });

  it('transiciona la consulta a closed tras emitir prescripción', async () => {
    const { consultation } = await service.issuePrescriptionWithConsultation(
      { consultationId: 'consultation-rx-close', usage: validUsage, expectedVersion: 2 },
      optometrist('req-rx-003')
    );
    expect(consultation.status).toBe('closed');
  });

  it('rechaza emisión si falta refracción de algún ojo', async () => {
    await expect(
      service.issuePrescription(
        { consultationId: 'consultation-incomplete', usage: validUsage, expectedVersion: 1 },
        optometrist('req-rx-004')
      )
    ).rejects.toThrow(/both eyes|refrac/i);
  });
});
