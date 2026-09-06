import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../lib/request-context';
import { clinicalService, prismaClinicalService } from '../../../../../lib/services';
import { isUuid } from '../../../../../modules/clinical/prisma-service';
import type { LensUsage } from '../../../../../../contracts/clinical.contract';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);
    const service = isUuid(id) ? prismaClinicalService : clinicalService;
    const body = (await request.json()) as Record<string, unknown>;

    if (!body.usage) {
      return NextResponse.json({ error: 'usage es obligatorio' }, { status: 400 });
    }

    const prescription = await service.issuePrescription(
      {
        consultationId: id,
        usage: body.usage as LensUsage,
        observations: body.observations ? String(body.observations) : undefined,
        expectedVersion: Number(body.expectedVersion ?? 1),
      },
      actor
    );

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo emitir la prescripción';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await context.params;
    const actor = actorFromRequest(request);
    const service = isUuid((await context.params).id) ? prismaClinicalService : clinicalService;
    const body = (await request.json()) as Record<string, unknown>;

    if (!body.prescriptionId || !body.amendmentReason || !body.usage) {
      return NextResponse.json(
        { error: 'prescriptionId, amendmentReason y usage son requeridos' },
        { status: 400 }
      );
    }

    const prescription = await service.amendPrescription(
      {
        prescriptionId: String(body.prescriptionId),
        amendmentReason: String(body.amendmentReason),
        usage: body.usage as LensUsage,
        observations: body.observations ? String(body.observations) : undefined,
        expectedVersion: Number(body.expectedVersion ?? 1),
      },
      actor
    );

    return NextResponse.json({ prescription });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo enmendar la prescripción';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
