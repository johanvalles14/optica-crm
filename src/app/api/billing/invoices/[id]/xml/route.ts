import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../../../lib/request-context';
import { billingService } from '../../../../../../lib/services';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = actorFromRequest(request);

    const xml = await billingService.getXml(id, actor);

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="CFDI_${id}.xml"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener XML';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
