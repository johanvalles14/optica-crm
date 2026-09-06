import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../../lib/request-context';
import { laboratoryService, prismaLaboratoryService } from '../../../../../../lib/services';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);
    const body = (await request.json()) as {
      reason: string;
      brokenProductId?: string;
      brokenQuantity?: number;
      additionalDeliveryDays?: number;
      expectedVersion?: number;
    };

    if (!body.reason || !body.reason.trim()) {
      return NextResponse.json(
        { error: 'El motivo de la repetición o rotura es obligatorio' },
        { status: 400 }
      );
    }

    const service = process.env.DATABASE_URL ? prismaLaboratoryService : laboratoryService;
    const order = await service.reportRework(
      {
        labOrderId: id,
        reason: body.reason,
        brokenProductId: body.brokenProductId,
        brokenQuantity: body.brokenQuantity,
        additionalDeliveryDays: body.additionalDeliveryDays,
        expectedVersion: Number(body.expectedVersion ?? 1),
      },
      actor
    );

    return NextResponse.json({ order, alertTriggered: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al reportar repetición';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
