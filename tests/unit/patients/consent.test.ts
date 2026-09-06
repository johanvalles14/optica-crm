import { describe, it, expect } from 'vitest';
import { hasValidConsent } from '../../../src/modules/patients/consent.service';

describe('RF-003 — Consentimiento y re-consentimiento', () => {
  it('devuelve false cuando el paciente no tiene consentimiento registrado', async () => {
    const result = await hasValidConsent('patient-without-consent', {
      currentNoticeId: 'notice-v1-2026',
    });
    expect(result).toBe(false);
  });

  it('devuelve true cuando el consentimiento coincide con el aviso vigente', async () => {
    const result = await hasValidConsent('patient-with-current-consent', {
      currentNoticeId: 'notice-v1-2026',
    });
    expect(result).toBe(true);
  });

  it('devuelve false cuando el aviso de privacidad cambió y se requiere re-consentimiento', async () => {
    const result = await hasValidConsent('patient-with-old-consent', {
      currentNoticeId: 'notice-v2-2026',
    });
    expect(result).toBe(false);
  });

  it('rechaza escritura clínica cuando no hay consentimiento vigente', async () => {
    await expect(
      hasValidConsent('patient-without-consent', { currentNoticeId: 'notice-v1-2026', blockClinicalWrite: true })
    ).rejects.toThrow(/consent/i);
  });
});
