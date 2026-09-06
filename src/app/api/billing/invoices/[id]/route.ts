import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../lib/request-context';
import { billingService } from '../../../../../lib/services';
import type { CancellationMotive } from '../../../../../../contracts/billing.contract';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);

    const invoice = await billingService.getInvoice(id, actor);
    if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });

    return NextResponse.json({ invoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al consultar factura';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);
    const body = (await request.json()) as {
      motive: CancellationMotive;
      replacementUuid?: string;
      expectedVersion?: number;
    };

    const invoice = await billingService.cancelInvoice(
      {
        invoiceId: id,
        motive: body.motive ?? '02',
        replacementUuid: body.replacementUuid,
        expectedVersion: Number(body.expectedVersion ?? 1),
      },
      actor
    );

    return NextResponse.json({ invoice, cancelled: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al cancelar factura ante el SAT';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
