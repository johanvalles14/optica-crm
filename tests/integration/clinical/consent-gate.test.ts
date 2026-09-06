import { describe, it, expect } from 'vitest';
import { ClinicalService } from '../../../src/modules/clinical/service';
import { optometrist, receptionist } from '../../fixtures/actors';

describe('RF-003 — Bloqueo de escritura clínica sin consentimiento vigente', () => {
  const service = new ClinicalService();

  it('bloquea addRefraction cuando no hay consentimiento vigente', async () => {
    await expect(
      service.addRefraction(
        { consultationId: 'consultation-no-consent', eye: 'OD', sphere: -2, cylinder: 0, axis: 0, expectedVersion: 1 },
        optometrist('req-ref-no-consent')
      )
    ).rejects.toThrow(/consent/i);
  });

  it('bloquea issuePrescription sin consentimiento vigente', async () => {
    await expect(
      service.issuePrescription(
        { consultationId: 'consultation-no-consent', usage: 'lejos', expectedVersion: 1 },
        optometrist('req-rx-no-consent')
      )
    ).rejects.toThrow(/consent/i);
  });

  it('bloquea enmienda clínica si el aviso de privacidad cambió', async () => {
    await expect(
      service.amendRefraction(
        {
          consultationId: 'consultation-old-consent',
          eye: 'OD',
          sphere: -2,
          cylinder: 0,
          axis: 0,
          amendedFromId: 'ref-od-001',
          amendmentReason: 'Ajuste',
          expectedVersion: 1,
        },
        optometrist('req-amend-old-consent')
      )
    ).rejects.toThrow(/re-consent|consent/i);
  });

  it('la secretaría no puede registrar consentimiento clínico', async () => {
    await expect(
      service.setNonClinicalNote(
        { consultationId: 'consultation-005', noteKey: 'follow_up', expectedVersion: 1 },
        receptionist('req-rec-consent')
      )
    ).rejects.toThrow(/permission/i);
  });
});
