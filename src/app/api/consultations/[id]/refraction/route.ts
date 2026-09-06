import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../lib/request-context';
import { clinicalService, prismaClinicalService } from '../../../../../lib/services';
import { isUuid } from '../../../../../modules/clinical/prisma-service';
import type { Eye } from '../../../../../../contracts/clinical.contract';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);
    const service = isUuid(id) ? prismaClinicalService : clinicalService;
    const body = (await request.json()) as Record<string, unknown>;

    const refraction = await service.addRefraction(
      {
        consultationId: id,
        eye: body.eye as Eye,
        sphere: body.sphere !== undefined && body.sphere !== null && body.sphere !== '' ? Number(body.sphere) : undefined,
        cylinder: body.cylinder !== undefined && body.cylinder !== null && body.cylinder !== '' ? Number(body.cylinder) : undefined,
        axis: body.axis !== undefined && body.axis !== null && body.axis !== '' ? Number(body.axis) : undefined,
        addition: body.addition !== undefined && body.addition !== null && body.addition !== '' ? Number(body.addition) : undefined,
        visualAcuity: body.visualAcuity ? String(body.visualAcuity) : undefined,
        pupillaryDistance: body.pupillaryDistance !== undefined && body.pupillaryDistance !== null && body.pupillaryDistance !== '' ? Number(body.pupillaryDistance) : undefined,
        expectedVersion: Number(body.expectedVersion ?? 1),
      },
      actor
    );

    return NextResponse.json({ refraction }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo registrar la refracción';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);
    const service = isUuid(id) ? prismaClinicalService : clinicalService;
    const body = (await request.json()) as Record<string, unknown>;

    if (!body.amendedFromId || !body.amendmentReason) {
      return NextResponse.json(
        { error: 'amendedFromId y amendmentReason son obligatorios para enmiendas' },
        { status: 400 }
      );
    }

    const refraction = await service.amendRefraction(
      {
        consultationId: id,
        amendedFromId: String(body.amendedFromId),
        amendmentReason: String(body.amendmentReason),
        eye: body.eye as Eye,
        sphere: body.sphere !== undefined && body.sphere !== null && body.sphere !== '' ? Number(body.sphere) : undefined,
        cylinder: body.cylinder !== undefined && body.cylinder !== null && body.cylinder !== '' ? Number(body.cylinder) : undefined,
        axis: body.axis !== undefined && body.axis !== null && body.axis !== '' ? Number(body.axis) : undefined,
        addition: body.addition !== undefined && body.addition !== null && body.addition !== '' ? Number(body.addition) : undefined,
        visualAcuity: body.visualAcuity ? String(body.visualAcuity) : undefined,
        pupillaryDistance: body.pupillaryDistance !== undefined && body.pupillaryDistance !== null && body.pupillaryDistance !== '' ? Number(body.pupillaryDistance) : undefined,
        expectedVersion: Number(body.expectedVersion ?? 1),
      },
      actor
    );

    return NextResponse.json({ refraction });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo enmendar la refracción';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
