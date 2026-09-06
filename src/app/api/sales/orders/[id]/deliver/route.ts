import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../../lib/request-context';
import { salesService, prismaSalesService } from '../../../../../../lib/services';
import type { PaymentMethod } from '../../../../../../../contracts/sales.contract';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actor = actorFromRequest(request);
    const body = (await request.json().catch(() => ({}))) as {
      finalPayment?: { amount: number; method: PaymentMethod };
      expectedVersion?: number;
    };

    const service = process.env.DATABASE_URL ? prismaSalesService : salesService;
    const order = await service.deliverAndClose(
      id,
      body.finalPayment,
      body.expectedVersion ?? 1,
      actor
    );

    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al registrar entrega de orden';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
