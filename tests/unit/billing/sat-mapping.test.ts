import { describe, it, expect } from 'vitest';
import { mapPaymentMethodToSat } from '../../../src/modules/billing/validators';

describe('RF-403 — Mapeo de Formas de Pago SAT PUE', () => {
  it('mapea correctamente efectivo a clave 01', () => {
    expect(mapPaymentMethodToSat('cash')).toBe('01');
  });

  it('mapea correctamente transferencia a clave 03', () => {
    expect(mapPaymentMethodToSat('transfer')).toBe('03');
  });

  it('mapea correctamente tarjeta de crédito a 04 y débito a 28', () => {
    expect(mapPaymentMethodToSat('card_credit')).toBe('04');
    expect(mapPaymentMethodToSat('card_debit')).toBe('28');
  });
});
