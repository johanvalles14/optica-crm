import { describe, it, expect } from 'vitest';
import { ClinicalService } from '../../../src/modules/clinical/service';
import { admin, optometrist } from '../../fixtures/actors';

describe('RF-005 — Liberación administrativa de consulta bloqueada', () => {
  const service = new ClinicalService();

  it('solo admin puede liberar una consulta in_progress', async () => {
    await expect(
      service.releaseConsultation(
        { consultationId: 'consultation-blocked', reason: 'Cambio de turno', expectedVersion: 1 },
        optometrist('req-release-opt-001')
      )
    ).rejects.toThrow(/permission|admin/i);

    const released = await service.releaseConsultation(
      { consultationId: 'consultation-blocked', reason: 'Cambio de turno', expectedVersion: 1 },
      admin('req-release-adm-001')
    );
    expect(released.status).toBe('in_progress');
  });

  it('registra la liberación en auditoría con motivo', async () => {
    const audit = await service.getAuditTrail('consultation-blocked');
    const releaseEntry = audit.find((e) => e.action === 'update' && e.reason === 'Cambio de turno');
    expect(releaseEntry).toBeDefined();
    expect(releaseEntry?.actorId).toBe('user-adm-001');
  });

  it('tras liberar, otro optometrista puede tomar la consulta', async () => {
    const taken = await service.takeOwnership(
      { consultationId: 'consultation-blocked', expectedVersion: 2 },
      optometrist('req-take-opt-002')
    );
    expect(taken.openedBy).toBe('user-opt-002');
  });
});
