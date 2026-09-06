import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../lib/request-context';
import { patientService, prismaPatientRepository } from '../../../../../lib/services';
import { patientRepository } from '../../../../../modules/patients/repository';
import { AuditService } from '../../../../../modules/audit/service';

type RouteContext = { params: Promise<{ folio: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { folio } = await context.params;
    const actor = actorFromRequest(request);
    const patient = await prismaPatientRepository.getPatientByFolio(folio).catch(() => undefined) ?? patientRepository.getPatientByFolio(folio);
    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }
    const notice = await prismaPatientRepository.getCurrentPrivacyNotice().catch(() => null);
    const valid = notice
      ? await prismaPatientRepository.hasValidConsent(patient.id, notice.id)
      : await patientService.hasValidConsent(patient.id, actor);
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
    const patient = await prismaPatientRepository.getPatientByFolio(folio).catch(() => undefined) ?? patientRepository.getPatientByFolio(folio);
    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    const body = (await request.json()) as { noticeId?: string; source?: string };
    const currentNotice = await prismaPatientRepository.getCurrentPrivacyNotice().catch(() => null);
    const consent = currentNotice
      ? await prismaPatientRepository.recordConsent(
        {
          patientId: patient.id,
          noticeId: body.noticeId ?? currentNotice.id,
          source: body.source ?? actor.source ?? 'web',
        },
        actor.actorId
      )
      : await patientService.recordConsent(
      {
        patientId: patient.id,
        noticeId: body.noticeId ?? patientRepository.getCurrentPrivacyNotice().id,
        source: body.source ?? actor.source ?? 'web',
      },
      actor
    );

    await new AuditService().record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'create',
      entity: 'Consent',
      entityId: consent.id,
      requestId: actor.requestId,
    });

    return NextResponse.json({ consent }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo registrar el consentimiento' },
      { status: 400 }
    );
  }
}
