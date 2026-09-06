import { describe, it, expect } from 'vitest';
import { validateTaxProfile } from '../../../src/modules/billing/validators';

describe('RF-401 — Validación de Datos Fiscales CFDI 4.0 (SAT)', () => {
  it('acepta perfil fiscal válido para persona física con uso D07', () => {
    expect(() =>
      validateTaxProfile({
        rfc: 'VAPJ850906HR7',
        legalName: 'JUAN PEREZ GONZALEZ',
        zipCode: '27000',
        taxSystem: '605',
        cfdiUse: 'D07',
      })
    ).not.toThrow();
  });

  it('acepta perfil fiscal válido para persona moral con uso G03', () => {
    expect(() =>
      validateTaxProfile({
        rfc: 'OPT180420AA1',
        legalName: 'OPTICA LAGUNA',
        zipCode: '27250',
        taxSystem: '601',
        cfdiUse: 'G03',
      })
    ).not.toThrow();
  });

  it('rechaza RFC con longitud o caracteres inválidos', () => {
    expect(() =>
      validateTaxProfile({
        rfc: 'RFC_INVALIDO',
        legalName: 'TEST',
        zipCode: '27000',
        taxSystem: '605',
      })
    ).toThrow(/RFC inv[aá]lido/i);
  });

  it('rechaza código postal fiscal que no tenga exactamente 5 dígitos', () => {
    expect(() =>
      validateTaxProfile({
        rfc: 'VAPJ850906HR7',
        legalName: 'JUAN PEREZ',
        zipCode: '2700', // 4 dígitos
        taxSystem: '605',
      })
    ).toThrow(/c[oó]digo postal/i);
  });
});
