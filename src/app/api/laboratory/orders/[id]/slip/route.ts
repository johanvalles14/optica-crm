import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../../lib/request-context';
import { laboratoryService, prismaLaboratoryService } from '../../../../../../lib/services';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);
    const service = process.env.DATABASE_URL ? prismaLaboratoryService : laboratoryService;
    const slip = await service.getTraySlip(id, actor);
    return NextResponse.json({ slip });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al generar boleta de charola';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
