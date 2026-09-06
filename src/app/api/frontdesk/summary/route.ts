import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../lib/request-context';
import { clinicalService } from '../../../../lib/services';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const actor = actorFromRequest(request);
    const folio = url.searchParams.get('folio');
    const patientId = url.searchParams.get('patientId');
    const result = folio
      ? await clinicalService.getSafeSummaryByFolio(folio, actor)
      : patientId
        ? await clinicalService.getSafeSummaryByPatientId(patientId, actor)
        : null;
    return NextResponse.json({ summary: result });
  } catch {
    return NextResponse.json({ error: 'No se pudo consultar el resumen seguro' }, { status: 404 });
  }
}
