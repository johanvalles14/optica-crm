import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../../lib/request-context';
import { cashService, prismaCashService } from '../../../../../../lib/services';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);
    const body = (await request.json()) as { amount?: number; description?: string; receiptNumber?: string };
    const service = process.env.DATABASE_URL ? prismaCashService : cashService;
    const expense = await service.recordExpense({ shiftId: id, amount: Number(body.amount), description: body.description ?? '', receiptNumber: body.receiptNumber }, actor);
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al registrar gasto';
    return NextResponse.json({ error: message }, { status: message.includes('Permission') ? 403 : 400 });
  }
}
