import { describe, it, expect } from 'vitest';
import { ClinicalService } from '../../../src/modules/clinical/service';
import { optometrist } from '../../fixtures/actors';

describe('RF-005 — Concurrencia con expectedVersion', () => {
  const service = new ClinicalService();

  it('rechaza sobrescritura perdida cuando expectedVersion no coincide', async () => {
    await expect(
      service.setNonClinicalNote(
        { consultationId: 'consultation-concurrent', noteKey: 'follow_up', expectedVersion: 0 },
        optometrist('req-concurrent-001')
      )
    ).rejects.toThrow(/stale version|expectedVersion/i);
  });

  it('permite actualización cuando expectedVersion coincide', async () => {
    const updated = await service.setNonClinicalNote(
      { consultationId: 'consultation-concurrent', noteKey: 'external_rx', expectedVersion: 2 },
      optometrist('req-concurrent-002')
    );
    expect(updated.version).toBe(3);
  });
});
