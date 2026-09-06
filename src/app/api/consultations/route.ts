import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../lib/request-context';
import { clinicalService } from '../../../lib/services';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { patientId?: string; branchId?: string };
    const consultation = await clinicalService.open({
      patientId: String(body.patientId ?? ''),
      branchId: String(body.branchId ?? 'branch-001'),
    }, actorFromRequest(request));
    return NextResponse.json(consultation, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'No se pudo abrir la consulta' }, { status: 400 });
  }
}
