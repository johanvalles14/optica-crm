import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../lib/request-context';
import { laboratoryService, prismaLaboratoryService } from '../../../../../lib/services';
import type { LabDestination, LabOrderStatus } from '../../../../../../contracts/laboratory.contract';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);
    const service = process.env.DATABASE_URL ? prismaLaboratoryService : laboratoryService;
    const order = await service.getOrder(id, actor);
    if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al consultar orden';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);
    const body = (await request.json()) as {
      action?: string;
      destination?: LabDestination;
      externalLabName?: string;
      externalGuideNumber?: string;
      expectedReturnDate?: string;
      newStatus?: LabOrderStatus;
      expectedVersion?: number;
    };

    const version = Number(body.expectedVersion ?? 1);

    if (body.action === 'assignDestination' && body.destination) {
      const service = process.env.DATABASE_URL ? prismaLaboratoryService : laboratoryService;
      const order = await service.assignDestination(
        {
          labOrderId: id,
          destination: body.destination,
          externalLabName: body.externalLabName,
          externalGuideNumber: body.externalGuideNumber,
          expectedReturnDate: body.expectedReturnDate ? new Date(body.expectedReturnDate) : undefined,
          expectedVersion: version,
        },
        actor
      );
      return NextResponse.json({ order });
    }

    if (body.newStatus) {
      const service = process.env.DATABASE_URL ? prismaLaboratoryService : laboratoryService;
      const order = await service.updateStatus(id, body.newStatus, version, actor);
      return NextResponse.json({ order });
    }

    return NextResponse.json({ error: 'Acción no permitida' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar orden';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
