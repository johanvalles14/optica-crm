import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../lib/request-context';
import { clinicalService, prismaClinicalService } from '../../../../../lib/services';
import { isUuid } from '../../../../../modules/clinical/prisma-service';
import type { NonClinicalNoteKey } from '../../../../../../contracts/clinical.contract';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);
    const service = isUuid(id) ? prismaClinicalService : clinicalService;
    const body = (await request.json()) as { noteKey?: NonClinicalNoteKey | null; expectedVersion?: number };

    const consultation = await service.setNonClinicalNote(
      {
        consultationId: id,
        noteKey: body.noteKey ?? null,
        expectedVersion: Number(body.expectedVersion ?? 1),
      },
      actor
    );

    return NextResponse.json({ consultation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar la nota no clínica';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
