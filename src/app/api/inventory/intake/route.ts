import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../lib/request-context';
import { inventoryService, prismaInventoryService } from '../../../../lib/services';
import type { ProductCategory } from '../../../../../contracts/inventory.contract';

export async function POST(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const body = (await request.json()) as {
      category: ProductCategory;
      brand?: string;
      descriptionPattern?: string;
      retailPrice: number;
      costPrice?: number;
      quantity: number;
      branchId?: string;
    };

    const service = process.env.DATABASE_URL ? prismaInventoryService : inventoryService;
    const products = await service.quickBatchIntake(
      {
        category: body.category,
        brand: body.brand,
        descriptionPattern: body.descriptionPattern,
        retailPrice: Number(body.retailPrice),
        costPrice: body.costPrice !== undefined ? Number(body.costPrice) : undefined,
        quantity: Number(body.quantity),
        branchId: body.branchId ?? 'branch-001',
      },
      actor
    );

    return NextResponse.json({ products }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al dar de alta lote';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
