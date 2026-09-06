import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../../lib/request-context';
import { salesService, prismaSalesService } from '../../../../../../lib/services';
import type { PaymentMethod } from '../../../../../../../contracts/sales.contract';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);
    const body = (await request.json()) as {
      amount: number;
      method: PaymentMethod;
      reference?: string;
      expectedVersion?: number;
    };

    const service = process.env.DATABASE_URL ? prismaSalesService : salesService;
    const order = await service.recordPayment(
      {
        orderId: id,
        amount: Number(body.amount),
        method: body.method,
        reference: body.reference,
        expectedVersion: Number(body.expectedVersion ?? 1),
      },
      actor
    );

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al registrar pago';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
