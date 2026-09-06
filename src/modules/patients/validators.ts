import type { PatientInput, Sex } from '../../../contracts/patients.contract';

const validSexes: Sex[] = ['male', 'female', 'other', 'not_specified'];

export function validatePatientInput(input: Partial<PatientInput>): void {
  if (!input.firstName || input.firstName.trim().length === 0) {
    throw new Error('firstName is required');
  }
  if (!input.lastName || input.lastName.trim().length === 0) {
    throw new Error('lastName is required');
  }
  if (!input.birthDate) {
    throw new Error('birthDate is required');
  }
  if (!input.sex || !validSexes.includes(input.sex)) {
    throw new Error('sex is required and must be a valid value');
  }
  if (!input.phone || input.phone.trim().length === 0) {
    throw new Error('phone is required');
  }
  if (!input.branchId) {
    throw new Error('branchId is required');
  }
}
