import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../lib/request-context';
import { patientService, prismaPatientRepository } from '../../../../lib/services';
import { authorize } from '../../../../modules/auth/rbac';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const actor = actorFromRequest(request);
    if (!authorize(actor.role, 'search', 'Patient')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const query = {
      name: url.searchParams.get('name')?.trim() || undefined,
      phone: url.searchParams.get('phone')?.trim() || undefined,
      folio: url.searchParams.get('folio')?.trim().toUpperCase() || undefined,
      limit: 20,
    };
    if (!query.name && !query.phone && !query.folio) {
      return NextResponse.json({ error: 'Ingresa un criterio de búsqueda' }, { status: 400 });
    }
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
