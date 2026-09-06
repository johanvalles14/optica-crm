import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../lib/request-context';
import { patientService, prismaPatientRepository } from '../../../../lib/services';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const actor = actorFromRequest(request);
    const query = {
      name: url.searchParams.get('name') ?? undefined,
      phone: url.searchParams.get('phone') ?? undefined,
      folio: url.searchParams.get('folio') ?? undefined,
      limit: 20,
    };
    try {
      const results = await prismaPatientRepository.searchPatients(query);
      return NextResponse.json({ results });
    } catch {
      const results = await patientService.search(query, actor);
      return NextResponse.json({ results });
    }
  } catch {
    return NextResponse.json({ error: 'No se pudo realizar la búsqueda' }, { status: 400 });
  }
}
