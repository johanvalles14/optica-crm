import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../lib/request-context';
import { cashService, prismaCashService } from '../../../../lib/services';

export async function GET(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const branchId = new URL(request.url).searchParams.get('branchId') ?? 'branch-001';
    const service = process.env.DATABASE_URL ? prismaCashService : cashService;
    const shift = await service.getCurrentShift(branchId, actor);
    return NextResponse.json({ shift });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al consultar turno';
    return NextResponse.json({ error: message }, { status: message.includes('Permission') ? 403 : 400 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const body = (await request.json()) as { branchId?: string; initialFloat?: number };
    const service = process.env.DATABASE_URL ? prismaCashService : cashService;
    const shift = await service.openShift({ branchId: body.branchId ?? 'branch-001', initialFloat: Number(body.initialFloat) }, actor);
    return NextResponse.json({ shift }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al abrir turno';
    return NextResponse.json({ error: message }, { status: message.includes('Permission') ? 403 : 400 });
  }
}
