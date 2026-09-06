import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../lib/request-context';
import { inventoryService } from '../../../../lib/services';
import type { MovementReason } from '../../../../../contracts/inventory.contract';

export async function POST(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const body = (await request.json()) as {
      productId: string;
      quantity: number;
      reason: MovementReason;
      notes: string;
    };

    const movement = await inventoryService.recordAdjustment(
      {
        productId: String(body.productId),
        quantity: Number(body.quantity),
        reason: body.reason,
        notes: String(body.notes ?? ''),
      },
      actor
    );

    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al registrar ajuste';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
