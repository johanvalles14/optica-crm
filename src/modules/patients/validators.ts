import type { PatientInput, Sex } from '../../../contracts/patients.contract';

const validSexes: Sex[] = ['male', 'female', 'other', 'not_specified'];

function validateBirthDate(value: Date): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error('birthDate must be a valid date');
  }
  if (value.getTime() > Date.now()) {
    throw new Error('birthDate cannot be in the future');
  }
}

function validatePhone(value: string, field = 'phone'): void {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    throw new Error(`${field} must contain between 10 and 15 digits`);
  }
}

function validateEmergencyContact(input: PatientInput['emergencyContact']): void {
  if (!input || !input.name?.trim() || !input.phone?.trim()) {
    throw new Error('emergencyContact requires name and phone');
  }
  validatePhone(input.phone, 'emergencyContact.phone');
}

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
  validateBirthDate(input.birthDate);
  if (!input.sex || !validSexes.includes(input.sex)) {
    throw new Error('sex is required and must be a valid value');
  }
  if (!input.phone || input.phone.trim().length === 0) {
    throw new Error('phone is required');
  }
  validatePhone(input.phone);
  if (!input.branchId) {
    throw new Error('branchId is required');
  }
  if (input.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    throw new Error('email must be valid');
  }
  if (input.emergencyContact !== undefined) {
    validateEmergencyContact(input.emergencyContact);
  }
}

export function validatePatientUpdate(input: Partial<PatientInput>): void {
  if (input.branchId !== undefined && input.branchId.trim().length === 0) {
    throw new Error('branchId cannot be empty');
  }
  if (input.firstName !== undefined && input.firstName.trim().length === 0) {
    throw new Error('firstName cannot be empty');
  }
  if (input.lastName !== undefined && input.lastName.trim().length === 0) {
    throw new Error('lastName cannot be empty');
  }
  if (input.birthDate !== undefined) {
    validateBirthDate(input.birthDate);
  }
  if (input.sex !== undefined && !validSexes.includes(input.sex)) {
    throw new Error('sex must be a valid value');
  }
  if (input.phone !== undefined) {
    validatePhone(input.phone);
  }
  if (input.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    throw new Error('email must be valid');
  }
  if (input.emergencyContact !== undefined) {
    validateEmergencyContact(input.emergencyContact);
  }
}
