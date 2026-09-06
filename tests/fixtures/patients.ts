import type { PatientInput } from '../../contracts/patients.contract';

export const makePatientInput = (overrides?: Partial<PatientInput>): PatientInput => ({
  branchId: 'branch-001',
  firstName: 'Juan',
  lastName: 'Pérez',
  middleName: 'García',
  birthDate: new Date('1990-05-15T00:00:00.000Z'),
  sex: 'male',
  phone: '8711234567',
  email: 'juan.perez@example.test',
  address: 'Calle Ficticia 123, Colonia Centro',
  allergies: 'Ninguna conocida',
  conditions: 'Ninguna conocida',
  emergencyContact: { name: 'Ana Pérez', phone: '8717654321' },
  ...overrides,
});

export const makeMinimalPatientInput = (overrides?: Partial<PatientInput>): PatientInput => ({
  branchId: 'branch-001',
  firstName: 'María',
  lastName: 'López',
  birthDate: new Date('1985-08-22T00:00:00.000Z'),
  sex: 'female',
  phone: '8719876543',
  ...overrides,
});
