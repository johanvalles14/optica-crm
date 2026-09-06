import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../lib/request-context';
import { patientService } from '../../../../../lib/services';
import { patientRepository } from '../../../../../modules/patients/repository';

type RouteContext = { params: Promise<{ folio: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { folio } = await context.params;
    const actor = actorFromRequest(request);
    const patient = patientRepository.getPatientByFolio(folio);
    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }
    const valid = await patientService.hasValidConsent(patient.id, actor);
    return NextResponse.json({
      valid,
      patientId: patient.id,
      folio: patient.folio,
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo verificar el consentimiento' }, { status: 400 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { folio } = await context.params;
    const actor = actorFromRequest(request);
    const patient = patientRepository.getPatientByFolio(folio);
    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    const body = (await request.json()) as { noticeId?: string; source?: string };
    const currentNotice = patientRepository.getCurrentPrivacyNotice();
    const consent = await patientService.recordConsent(
      {
        patientId: patient.id,
        noticeId: body.noticeId ?? currentNotice.id,
        source: body.source ?? actor.source ?? 'web',
      },
      actor
    );

    return NextResponse.json({ consent }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo registrar el consentimiento' },
      { status: 400 }
    );
  }
}
