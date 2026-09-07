import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../lib/request-context';
import { patientService, prismaPatientRepository } from '../../../../../lib/services';
import { patientRepository } from '../../../../../modules/patients/repository';
import { AuditService } from '../../../../../modules/audit/service';
import { authorize } from '../../../../../modules/auth/rbac';

type RouteContext = { params: Promise<{ folio: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { folio } = await context.params;
    const actor = actorFromRequest(request);
    if (!authorize(actor.role, 'search', 'Patient')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
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
    if (!authorize(actor.role, 'update', 'Patient')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const patient = await prismaPatientRepository.getPatientByFolio(folio).catch(() => undefined) ?? patientRepository.getPatientByFolio(folio);
    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    const payload = await request.json() as unknown;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
    }
    const body = payload as { noticeId?: unknown; source?: unknown };
    if (body.noticeId !== undefined && typeof body.noticeId !== 'string') {
      return NextResponse.json({ error: 'Aviso de privacidad inválido' }, { status: 400 });
    }
    if (body.source !== undefined && typeof body.source !== 'string') {
      return NextResponse.json({ error: 'Origen de consentimiento inválido' }, { status: 400 });
    }
    const currentNotice = await prismaPatientRepository.getCurrentPrivacyNotice().catch(() => null);
    const activeNoticeId = currentNotice?.id ?? patientRepository.getCurrentPrivacyNotice().id;
    if (body.noticeId && body.noticeId !== activeNoticeId) {
      return NextResponse.json({ error: 'El aviso de privacidad ya no está vigente' }, { status: 400 });
    }
    const source = body.source?.trim() || actor.source || 'web';
    if (source.length > 120) {
      return NextResponse.json({ error: 'Origen de consentimiento inválido' }, { status: 400 });
    }
    const consent = currentNotice
      ? await prismaPatientRepository.recordConsent(
        {
          patientId: patient.id,
          noticeId: activeNoticeId,
          source,
        },
        actor.actorId
      )
      : await patientService.recordConsent(
        {
          patientId: patient.id,
          noticeId: activeNoticeId,
          source,
        },
        actor
      );

    if (currentNotice) {
      await new AuditService().record({
        actorId: actor.actorId,
        role: actor.role,
        action: 'create',
        entity: 'Consent',
        entityId: consent.id,
        requestId: actor.requestId,
      });
    }

    return NextResponse.json({ consent }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo registrar el consentimiento' },
      { status: 400 }
    );
  }
}
