import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../lib/request-context';
import { salesService, prismaSalesService } from '../../../../lib/services';
import { salesRepository } from '../../../../modules/sales/repository';
import type { CreateSaleOrderInput } from '../../../../../contracts/sales.contract';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const branchId = url.searchParams.get('branchId') ?? 'branch-001';
    const orders = process.env.DATABASE_URL ? await prismaSalesService.listOrders(branchId) : salesRepository.listOrders(branchId);
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al listar órdenes' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const body = (await request.json()) as CreateSaleOrderInput;

    const service = process.env.DATABASE_URL ? prismaSalesService : salesService;
    const order = await service.createOrder(
      {
        branchId: body.branchId ?? 'branch-001',
        patientId: body.patientId,
        patientName: body.patientName,
        prescriptionId: body.prescriptionId,
        items: body.items,
        discount: body.discount !== undefined ? Number(body.discount) : undefined,
        promisedDeliveryDate: body.promisedDeliveryDate ? new Date(body.promisedDeliveryDate) : undefined,
        notes: body.notes,
        initialPayment: body.initialPayment,
      },
      actor
    );

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear orden de venta';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
