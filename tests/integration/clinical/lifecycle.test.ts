import { describe, it, expect } from 'vitest';
import { ClinicalService } from '../../../src/modules/clinical/service';
import { optometrist, admin } from '../../fixtures/actors';

describe('RF-005 — Ciclo de vida de consulta', () => {
  const service = new ClinicalService();

  it('abre consulta en estado in_progress con versión inicial 1', async () => {
    const consultation = await service.open(
      { patientId: 'patient-001', branchId: 'branch-001' },
      optometrist('req-open-001')
    );
    expect(consultation.status).toBe('in_progress');
    expect(consultation.version).toBe(1);
  });

  it('rechaza abrir segunda consulta in_progress para el mismo paciente', async () => {
    await expect(
      service.open({ patientId: 'patient-001', branchId: 'branch-001' }, optometrist('req-open-002'))
    ).rejects.toThrow(/already has an in-progress consultation/i);
  });

  it('transiciona in_progress → abandoned con motivo', async () => {
    const consultation = await service.abandon(
      { consultationId: 'consultation-001', reason: 'Paciente no se presentó', expectedVersion: 1 },
      optometrist('req-abandon-001')
    );
    expect(consultation.status).toBe('abandoned');
    expect(consultation.abandonmentReason).toBe('Paciente no se presentó');
  });

  it('bloquea edición de consulta en estado final', async () => {
    await expect(
      service.setNonClinicalNote(
        { consultationId: 'consultation-001', noteKey: 'follow_up', expectedVersion: 1 },
        optometrist('req-edit-final-001')
      )
    ).rejects.toThrow(/final state/i);
  });

  it('solo admin puede liberar una consulta in_progress bloqueada', async () => {
    await expect(
      service.releaseConsultation(
        { consultationId: 'consultation-locked', reason: 'Cambio de turno', expectedVersion: 1 },
        optometrist('req-release-opt-001')
      )
    ).rejects.toThrow(/permission/i);

    const released = await service.releaseConsultation(
      { consultationId: 'consultation-locked', reason: 'Cambio de turno', expectedVersion: 1 },
      admin('req-release-adm-001')
    );
    expect(released.status).toBe('in_progress');
  });
});
