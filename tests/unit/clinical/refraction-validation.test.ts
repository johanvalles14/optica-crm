import { describe, it, expect } from 'vitest';
import { validateRefraction } from '../../../src/modules/clinical/validators';
import {
  validRightEye,
  validLeftEye,
  neutralEye,
  invalidPositiveCylinder,
  missingAxisWithCylinder,
  sphereOutOfRange,
  cylinderOutOfRange,
  axisOutOfRange,
  additionOutOfRange,
  pupillaryDistanceOutOfRange,
  invalidVisualAcuityFormat,
} from '../../fixtures/refractions';

describe('RF-006 / RF-007 — Validación de refracción OD/OI', () => {
  it('acepta valores refractivos válidos para OD y OI', () => {
    expect(() => validateRefraction(validRightEye)).not.toThrow();
    expect(() => validateRefraction(validLeftEye)).not.toThrow();
  });

  it('acepta valores neutros explícitos (0.00) cuando se registran formalmente', () => {
    expect(() => validateRefraction(neutralEye('OD'))).not.toThrow();
    expect(() => validateRefraction(neutralEye('OI'))).not.toThrow();
  });

  it('rechaza cilindro positivo (debe ser negativo o cero)', () => {
    expect(() => validateRefraction(invalidPositiveCylinder)).toThrow(/cylinder/i);
  });

  it('rechaza cilindro distinto de cero sin eje', () => {
    expect(() => validateRefraction(missingAxisWithCylinder)).toThrow(/axis/i);
  });

  it('rechaza esfera fuera de rango -30.00 a +30.00', () => {
    expect(() => validateRefraction(sphereOutOfRange)).toThrow(/sphere/i);
  });

  it('rechaza cilindro fuera de rango 0.00 a -10.00', () => {
    expect(() => validateRefraction(cylinderOutOfRange)).toThrow(/cylinder/i);
  });

  it('rechaza eje fuera de rango 0° a 180°', () => {
    expect(() => validateRefraction(axisOutOfRange)).toThrow(/axis/i);
  });

  it('rechaza adición fuera de rango 0.00 a +5.00', () => {
    expect(() => validateRefraction(additionOutOfRange)).toThrow(/addition/i);
  });

  it('rechaza distancia pupilar fuera de rango 30 mm a 80 mm', () => {
    expect(() => validateRefraction(pupillaryDistanceOutOfRange)).toThrow(/pupillary/i);
  });

  it('rechaza formato de agudeza visual no reconocido', () => {
    expect(() => validateRefraction(invalidVisualAcuityFormat)).toThrow(/acuity/i);
  });
});
