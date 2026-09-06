import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../lib/request-context';
import { prismaPatientRepository } from '../../../lib/services';
import { validatePatientInput } from '../../../modules/patients/validators';

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { patientId?: string; expectedVersion?: number; [key: string]: unknown };
    const { patientId, expectedVersion, ...input } = body;
    if (!patientId || typeof expectedVersion !== 'number') {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
    }
    const patient = await prismaPatientRepository.updatePatient(
      patientId,
      input,
      expectedVersion,
      actorFromRequest(request).actorId
    );
    return NextResponse.json({ patient });
  } catch {
    return NextResponse.json({ error: 'No se pudo actualizar el expediente' }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const input = {
      branchId: String(body.branchId ?? ''),
      firstName: String(body.firstName ?? ''),
      lastName: String(body.lastName ?? ''),
      birthDate: new Date(String(body.birthDate ?? '')),
      sex: body.sex as 'male' | 'female' | 'other' | 'not_specified',
      phone: String(body.phone ?? ''),
    };
    validatePatientInput(input);
    const patient = await prismaPatientRepository.createPatient(input, actorFromRequest(request).actorId);
    return NextResponse.json({ folio: patient.folio, version: patient.version }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'No se pudo crear el expediente' }, { status: 400 });
  }
}
