import { NextResponse } from 'next/server';
import { prismaPatientRepository } from '../../../lib/services';
import { patientRepository } from '../../../modules/patients/repository';

export async function GET() {
  try {
    const notice = await prismaPatientRepository.getCurrentPrivacyNotice().catch(() => patientRepository.getCurrentPrivacyNotice());
    return NextResponse.json({ notice });
  } catch {
    return NextResponse.json({ error: 'No se pudo obtener el aviso de privacidad' }, { status: 500 });
  }
}
