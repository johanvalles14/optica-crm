import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../lib/request-context';
import { clinicalService, prismaClinicalService } from '../../../../lib/services';
import { isUuid } from '../../../../modules/clinical/prisma-service';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);
    const service = isUuid(id) ? prismaClinicalService : clinicalService;
    const url = new URL(request.url);
    if (url.searchParams.get('view') === 'full') {
      try {
        const full = await service.getFullConsultation(id, actor);
        return NextResponse.json(full);
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        if (message.toLowerCase().includes('permission')) {
          return NextResponse.json({ error: 'Acceso no autorizado a expediente clínico' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });
      }
    }
    return NextResponse.json(await service.getSafeSummary(id, actor));
  } catch {
    return NextResponse.json({ error: 'No se pudo consultar el resumen' }, { status: 404 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json() as {
      action?: string;
      reason?: string;
      diagnosis?: string;
      clinicalNotes?: string;
      expectedVersion?: number;
    };
    const actor = actorFromRequest(request);
    const service = isUuid(id) ? prismaClinicalService : clinicalService;
    if (body.action === 'release') {
      return NextResponse.json(await service.releaseConsultation({
        consultationId: id,
        reason: String(body.reason ?? ''),
        expectedVersion: Number(body.expectedVersion),
      }, actor));
    }
    if (body.action === 'abandon') {
      return NextResponse.json(await service.abandon({
        consultationId: id,
        reason: String(body.reason ?? ''),
        expectedVersion: Number(body.expectedVersion),
      }, actor));
    }
    if (body.action === 'clinical_details') {
      return NextResponse.json(await service.updateClinicalDetails({
        consultationId: id,
        diagnosis: body.diagnosis,
        clinicalNotes: body.clinicalNotes,
        expectedVersion: Number(body.expectedVersion),
      }, actor));
    }
    return NextResponse.json({ error: 'Acción no permitida' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'No se pudo actualizar la consulta' }, { status: 400 });
  }
}
