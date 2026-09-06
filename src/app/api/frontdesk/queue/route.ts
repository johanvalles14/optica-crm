import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../lib/request-context';
import { clinicalService, prismaClinicalService } from '../../../../lib/services';

export async function GET(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const service = process.env.DATABASE_URL ? prismaClinicalService : clinicalService;
    const queue = await service.listReceptionQueue(actor);
    const url = new URL(request.url);
    const consultationId = url.searchParams.get('consultationId');
    const entry = consultationId
      ? queue.find((item) => item.consultation.id === consultationId)
      : undefined;
    return NextResponse.json({ queue, entry, refreshedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo consultar la cola de recepción';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
