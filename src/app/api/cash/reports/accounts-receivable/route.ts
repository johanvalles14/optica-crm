import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../lib/request-context';
import { cashService, prismaCashService } from '../../../../../lib/services';

export async function GET(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const branchId = new URL(request.url).searchParams.get('branchId') ?? 'branch-001';
    const service = process.env.DATABASE_URL ? prismaCashService : cashService;
    const report = await service.getAccountsReceivable(branchId, actor);
    return NextResponse.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al consultar saldos';
    return NextResponse.json({ error: message }, { status: message.includes('Permission') ? 403 : 400 });
  }
}
