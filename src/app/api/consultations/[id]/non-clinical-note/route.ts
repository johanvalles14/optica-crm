import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../lib/request-context';
import { clinicalService } from '../../../../../lib/services';
import type { NonClinicalNoteKey } from '../../../../../../contracts/clinical.contract';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);
    const body = (await request.json()) as { noteKey?: NonClinicalNoteKey | null; expectedVersion?: number };

    const consultation = await clinicalService.setNonClinicalNote(
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
