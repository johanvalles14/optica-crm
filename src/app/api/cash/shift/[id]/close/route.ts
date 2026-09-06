import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../../lib/request-context';
import { cashService, prismaCashService } from '../../../../../../lib/services';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);
    const body = (await request.json()) as { declaredCash?: number; notes?: string; expectedVersion?: number };
    const service = process.env.DATABASE_URL ? prismaCashService : cashService;
    const shift = await service.closeShift({ shiftId: id, declaredCash: Number(body.declaredCash), notes: body.notes, expectedVersion: Number(body.expectedVersion) }, actor);
    return NextResponse.json({ shift });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al cerrar turno';
    return NextResponse.json({ error: message }, { status: message.includes('Permission') ? 403 : 400 });
  }
}
