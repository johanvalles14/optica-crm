import { describe, expect, it } from 'vitest';
import type { PatientInput } from '../../../contracts/patients.contract';
import { validatePatientInput, validatePatientUpdate } from '../../../src/modules/patients/validators';

const validPatient: PatientInput = {
  branchId: 'branch-001',
  firstName: 'Ana',
  lastName: 'Garcia',
  birthDate: new Date('1990-01-01T00:00:00.000Z'),
  sex: 'female',
  phone: '871 123 4567',
  email: 'ana@example.test',
};

describe('Validacion de pacientes', () => {
  it('acepta datos validos y formatos humanos de telefono', () => {
    expect(() => validatePatientInput(validPatient)).not.toThrow();
  });

  it('rechaza fechas invalidas o futuras', () => {
    expect(() => validatePatientInput({ ...validPatient, birthDate: new Date('invalid') })).toThrow(/valid date/i);
    expect(() => validatePatientInput({ ...validPatient, birthDate: new Date('2999-01-01') })).toThrow(/future/i);
  });

  it('rechaza telefono, correo y contacto de emergencia invalidos', () => {
    expect(() => validatePatientInput({ ...validPatient, phone: '1234' })).toThrow(/10 and 15 digits/i);
    expect(() => validatePatientInput({ ...validPatient, email: 'correo-invalido' })).toThrow(/email/i);
    expect(() => validatePatientInput({
      ...validPatient,
      emergencyContact: { name: '', phone: '8711234567' },
    })).toThrow(/emergencyContact/i);
  });

  it('valida solo los campos presentes durante una edicion', () => {
    expect(() => validatePatientUpdate({ firstName: 'Maria' })).not.toThrow();
    expect(() => validatePatientUpdate({ firstName: '   ' })).toThrow(/firstName/i);
    expect(() => validatePatientUpdate({ phone: '555' })).toThrow(/10 and 15 digits/i);
  });
});
