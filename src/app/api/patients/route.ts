import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../lib/request-context';
import { prismaPatientRepository } from '../../../lib/services';
import { AuditService } from '../../../modules/audit/service';
import { authorize } from '../../../modules/auth/rbac';
import type { PatientInput, Sex } from '../../../../contracts/patients.contract';
import { validatePatientInput, validatePatientUpdate } from '../../../modules/patients/validators';

const patientFields = [
  'firstName', 'lastName', 'middleName', 'sex', 'phone', 'email',
  'address', 'allergies', 'conditions',
] as const;

function parseDate(value: unknown): Date {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    throw new Error('Fecha de nacimiento inválida');
  }
  return value instanceof Date ? value : new Date(value);
}

function parseEmergencyContact(value: unknown): PatientInput['emergencyContact'] {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Contacto de emergencia inválido');
  }
  const contact = value as Record<string, unknown>;
  if (typeof contact.name !== 'string' || typeof contact.phone !== 'string') {
    throw new Error('Contacto de emergencia inválido');
  }
  return { name: contact.name.trim(), phone: contact.phone.trim() };
}

function parsePatientUpdate(body: Record<string, unknown>): Partial<PatientInput> {
  const input: Record<string, unknown> = {};
  for (const field of patientFields) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== 'string') throw new Error(`${field} inválido`);
    input[field] = (body[field] as string).trim();
  }
  if (body.birthDate !== undefined) input.birthDate = parseDate(body.birthDate);
  if (body.emergencyContact !== undefined) input.emergencyContact = parseEmergencyContact(body.emergencyContact);
  return input as Partial<PatientInput>;
}

function errorStatus(error: unknown): number {
  return error instanceof Error && error.message === 'Permission denied' ? 403 : 400;
}

export async function PATCH(request: Request) {
  try {
    const actor = actorFromRequest(request);
    if (!authorize(actor.role, 'update', 'Patient')) throw new Error('Permission denied');
    const body = await request.json() as { patientId?: string; expectedVersion?: number; [key: string]: unknown };
    const { patientId, expectedVersion } = body;
    if (!patientId || !Number.isInteger(expectedVersion) || (expectedVersion ?? 0) < 1) {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
    }
    const input = parsePatientUpdate(body);
    if (Object.keys(input).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }
    validatePatientUpdate(input);
    const patient = await prismaPatientRepository.updatePatient(
      patientId,
      input,
      expectedVersion as number,
      actor.actorId
    );
    return NextResponse.json({ patient });
  } catch (error) {
    return NextResponse.json(
      { error: errorStatus(error) === 403 ? 'No autorizado' : 'No se pudo actualizar el expediente' },
      { status: errorStatus(error) }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = actorFromRequest(request);
    if (!authorize(actor.role, 'create', 'Patient')) throw new Error('Permission denied');
    const body = await request.json() as Record<string, unknown>;
    const input = {
      branchId: typeof body.branchId === 'string' ? body.branchId.trim() : '',
      firstName: typeof body.firstName === 'string' ? body.firstName.trim() : '',
      lastName: typeof body.lastName === 'string' ? body.lastName.trim() : '',
      middleName: typeof body.middleName === 'string' && body.middleName.trim() ? body.middleName.trim() : undefined,
      birthDate: parseDate(body.birthDate),
      sex: body.sex as Sex,
      phone: typeof body.phone === 'string' ? body.phone.trim() : '',
      email: typeof body.email === 'string' && body.email.trim() ? body.email.trim() : undefined,
      address: typeof body.address === 'string' && body.address.trim() ? body.address.trim() : undefined,
      allergies: typeof body.allergies === 'string' && body.allergies.trim() ? body.allergies.trim() : undefined,
      conditions: typeof body.conditions === 'string' && body.conditions.trim() ? body.conditions.trim() : undefined,
      emergencyContact: parseEmergencyContact(body.emergencyContact),
    };
    validatePatientInput(input);
    const patient = await prismaPatientRepository.createPatient(input, actor.actorId);
    await new AuditService().record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'create',
      entity: 'Patient',
      entityId: patient.id,
      requestId: actor.requestId,
    });
    return NextResponse.json({ patientId: patient.id, folio: patient.folio, version: patient.version }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: errorStatus(error) === 403 ? 'No autorizado' : 'No se pudo crear el expediente' },
      { status: errorStatus(error) }
    );
  }
}
