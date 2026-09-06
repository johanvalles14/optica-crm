import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../lib/request-context';
import { clinicalService, patientService, prismaClinicalService, prismaPatientRepository } from '../../../lib/services';
import { isUuid } from '../../../modules/clinical/prisma-service';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { patientId?: string; folio?: string; branchId?: string };
    const actor = actorFromRequest(request);
    let patientId = body.patientId;
    if (!patientId && body.folio) {
      const patient = process.env.DATABASE_URL
        ? await prismaPatientRepository.getPatientByFolio(body.folio)
        : await patientService.findByFolio(body.folio, actor);
      if (!patient) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
      patientId = patient.id;
    }
    if (!patientId) {
      return NextResponse.json({ error: 'patientId o folio es requerido' }, { status: 400 });
    }
    const service = isUuid(patientId) ? prismaClinicalService : clinicalService;
    const consultation = await service.open({
      patientId,
      branchId: String(body.branchId ?? 'branch-001'),
    }, actor);
    return NextResponse.json(consultation, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo abrir la consulta';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
