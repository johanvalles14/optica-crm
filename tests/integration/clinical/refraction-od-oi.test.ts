import { describe, it, expect } from 'vitest';
import { RefractionService } from '../../../src/modules/clinical/refraction.service';
import { optometrist } from '../../fixtures/actors';
import { validRightEye, validLeftEye, neutralEye } from '../../fixtures/refractions';

describe('RF-006 / RF-007 — Captura de refracción OD/OI', () => {
  const service = new RefractionService();

  it('registra refracción válida para ambos ojos', async () => {
    const right = await service.addRefraction(
      { consultationId: 'consultation-002', ...validRightEye, expectedVersion: 1 },
      optometrist('req-ref-001')
    );
    const left = await service.addRefraction(
      { consultationId: 'consultation-002', ...validLeftEye, expectedVersion: 1 },
      optometrist('req-ref-002')
    );

    expect(right.eye).toBe('OD');
    expect(left.eye).toBe('OI');
    expect(right.createdBy).toBe('user-opt-001');
  });

  it('permite valores neutros explícitos para un ojo', async () => {
    const neutral = await service.addRefraction(
      { consultationId: 'consultation-003', ...neutralEye('OD'), expectedVersion: 1 },
      optometrist('req-ref-003')
    );
    expect(neutral.sphere).toBe(0);
    expect(neutral.cylinder).toBe(0);
  });

  it('asocia timestamp y usuario a cada refracción', async () => {
    const refraction = await service.addRefraction(
      { consultationId: 'consultation-004', ...validRightEye, expectedVersion: 1 },
      optometrist('req-ref-004')
    );
    expect(refraction.createdAt).toBeInstanceOf(Date);
    expect(refraction.createdBy).toBe('user-opt-001');
  });
});
