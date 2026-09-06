import { describe, it, expect } from 'vitest';
import { AuditService } from '../../../src/modules/audit/service';
import { receptionist, optometrist } from '../../fixtures/actors';

describe('RF-010 — Auditoría con requestId y ACCESS_DENIED', () => {
  const audit = new AuditService();

  it('registra ACCESS_DENIED con actor, recurso y requestId', async () => {
    const actor = receptionist('req-audit-denied-001');
    const entry = await audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'ACCESS_DENIED',
      entity: 'FullConsultation',
      entityId: 'consultation-audit-001',
      requestId: actor.requestId,
      reason: 'frontdesk lacks permission',
      metadata: { resource: 'FullConsultation' },
    });

    expect(entry.action).toBe('ACCESS_DENIED');
    expect(entry.requestId).toBe('req-audit-denied-001');
    expect(entry.actorId).toBe('user-rec-001');
    expect(entry.occurredAt).toBeInstanceOf(Date);
  });

  it('la metadata de auditoría no contiene datos sensibles', async () => {
    const actor = optometrist('req-audit-write-001');
    const entry = await audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'create',
      entity: 'Refraction',
      entityId: 'ref-audit-001',
      requestId: actor.requestId,
      metadata: { eye: 'OD' },
    });

    expect(entry.metadata).not.toHaveProperty('sphere');
    expect(entry.metadata).not.toHaveProperty('cylinder');
    expect(entry.metadata).not.toHaveProperty('axis');
    expect(entry.metadata).not.toHaveProperty('diagnosis');
    expect(entry.metadata).not.toHaveProperty('allergies');
  });

  it('toda lectura de datos clínicos genera traza de auditoría', async () => {
    const actor = optometrist('req-audit-read-001');
    const entries = await audit.findByEntity('Refraction', 'ref-audit-read-001');
    const readEntry = entries.find((e) => e.action === 'read');
    expect(readEntry).toBeDefined();
    expect(readEntry?.requestId).toBe('req-audit-read-001');
  });
});
