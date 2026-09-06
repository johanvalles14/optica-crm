import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../lib/request-context';
import { inventoryService, prismaInventoryService } from '../../../../lib/services';
import type { ProductCategory } from '../../../../../contracts/inventory.contract';

export async function GET(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const url = new URL(request.url);
    const term = url.searchParams.get('term') ?? undefined;
    const category = (url.searchParams.get('category') as ProductCategory) ?? undefined;
    const branchId = url.searchParams.get('branchId') ?? 'branch-001';
    const onlyInStock = url.searchParams.get('onlyInStock') === 'true';

    const service = process.env.DATABASE_URL ? prismaInventoryService : inventoryService;
    const products = await service.search(
      {
        term,
        category,
        branchId,
        onlyInStock,
      },
      actor
    );

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al buscar productos' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const body = (await request.json()) as Record<string, unknown>;

    const service = process.env.DATABASE_URL ? prismaInventoryService : inventoryService;
    const product = await service.createProduct(
      {
        category: body.category as ProductCategory,
        brand: body.brand ? String(body.brand) : undefined,
        model: body.model ? String(body.model) : undefined,
        color: body.color ? String(body.color) : undefined,
        description: body.description ? String(body.description) : undefined,
        vendorBarcode: body.vendorBarcode ? String(body.vendorBarcode) : undefined,
        retailPrice: Number(body.retailPrice),
        costPrice: body.costPrice !== undefined ? Number(body.costPrice) : undefined,
        initialStock: Number(body.initialStock ?? 1),
        branchId: String(body.branchId ?? 'branch-001'),
        active: true,
      },
      actor
    );

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al registrar producto';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
