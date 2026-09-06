import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../lib/request-context';
import { clinicalService, prismaClinicalService } from '../../../../lib/services';
import { isUuid } from '../../../../modules/clinical/prisma-service';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const actor = actorFromRequest(request);
    const folio = url.searchParams.get('folio');
    const patientId = url.searchParams.get('patientId');
    const result = folio
      ? await prismaClinicalService.getSafeSummaryByFolio(folio, actor).catch(() => clinicalService.getSafeSummaryByFolio(folio, actor))
      : patientId
        ? (isUuid(patientId)
          ? await prismaClinicalService.getSafeSummaryByPatientId(patientId, actor)
          : await clinicalService.getSafeSummaryByPatientId(patientId, actor))
        : null;
    return NextResponse.json({ summary: result });
  } catch {
    return NextResponse.json({ error: 'No se pudo consultar el resumen seguro' }, { status: 404 });
  }
}
