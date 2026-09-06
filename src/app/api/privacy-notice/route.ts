import { NextResponse } from 'next/server';
import { patientRepository } from '../../../modules/patients/repository';

export async function GET() {
  try {
    const notice = patientRepository.getCurrentPrivacyNotice();
    return NextResponse.json({ notice });
  } catch {
    return NextResponse.json({ error: 'No se pudo obtener el aviso de privacidad' }, { status: 500 });
  }
}
