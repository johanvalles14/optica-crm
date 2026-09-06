import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../lib/request-context';
import { laboratoryService, prismaLaboratoryService } from '../../../../lib/services';
import type { CreateLabOrderInput } from '../../../../../contracts/laboratory.contract';

export async function GET(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const url = new URL(request.url);
    const branchId = url.searchParams.get('branchId') ?? 'branch-001';

    const service = process.env.DATABASE_URL ? prismaLaboratoryService : laboratoryService;
    const orders = await service.listOrders(branchId, actor);
    return NextResponse.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al listar órdenes de taller';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const body = (await request.json()) as CreateLabOrderInput;

    const service = process.env.DATABASE_URL ? prismaLaboratoryService : laboratoryService;
    const order = await service.createOrder(body, actor);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear orden de taller';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
