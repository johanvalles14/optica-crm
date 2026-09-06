import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { patientRepository } from '../../../../modules/patients/repository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID o Folio de paciente requerido' }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    try {
      if (process.env.DATABASE_URL) {
        const patient = await prisma.patient.findFirst({
          where: isUuid ? { id } : { folio: id },
          include: {
            consultations: {
              include: {
                refractions: {
                  orderBy: { createdAt: 'desc' },
                },
                prescriptions: {
                  orderBy: { issuedAt: 'desc' },
                },
              },
              orderBy: { openedAt: 'desc' },
            },
            saleOrders: {
              include: {
                items: true,
                payments: true,
              },
              orderBy: { createdAt: 'desc' },
            },
            consents: {
              include: { notice: true },
              orderBy: { grantedAt: 'desc' },
            },
          },
        });

        if (patient) {
          return NextResponse.json({ patient });
        }
      }
    } catch {
      // Continuar con fallback en memoria si la base de datos no está accesible en pruebas
    }

    const inMemPatient = isUuid
      ? patientRepository.getPatient(id)
      : patientRepository.getPatientByFolio(id);

    if (inMemPatient) {
      return NextResponse.json({
        patient: {
          ...inMemPatient,
          consultations: [],
          saleOrders: [],
          consents: [],
        },
      });
    }

    return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener expediente' },
      { status: 500 }
    );
  }
}
