import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../../lib/request-context';
import { laboratoryService, prismaLaboratoryService } from '../../../../../../lib/services';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);
    const body = (await request.json().catch(() => ({}))) as { expectedVersion?: number };

    const service = process.env.DATABASE_URL ? prismaLaboratoryService : laboratoryService;
    const order = await service.approveQuality(
      id,
      Number(body.expectedVersion ?? 1),
      actor
    );

    return NextResponse.json({ order, readyForDelivery: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al aprobar control de calidad';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
