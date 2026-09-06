import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const users = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    displayName: 'Optometrista de prueba',
    email: 'optometrista@example.test',
    role: 'clinical:optometrist',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    displayName: 'Asistente de prueba',
    email: 'asistente@example.test',
    role: 'clinical:assistant',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    displayName: 'Recepción de prueba',
    email: 'recepcion@example.test',
    role: 'frontdesk:receptionist',
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    displayName: 'Administrador de prueba',
    email: 'admin@example.test',
    role: 'admin',
  },
];

const notes = [
  ['follow_up', 'Paciente solicita cita de seguimiento', 1],
  ['external_rx', 'Paciente trae receta externa', 2],
  ['contact_later', 'Requiere contacto posterior', 3],
  ['prefer_phone', 'Preferencia de contacto por teléfono', 4],
  ['prefer_email', 'Preferencia de contacto por correo', 5],
] as const;

async function main(): Promise<void> {
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }

  await prisma.branch.upsert({
    where: { code: 'PT' },
    update: { name: 'Sucursal de prueba' },
    create: {
      code: 'PT',
      name: 'Sucursal de prueba',
      nextPatientSequence: 1,
      nextPrescriptionSequence: 1,
    },
  });

  await prisma.privacyNotice.upsert({
    where: { version: '1.0.0-test' },
    update: { contentHash: 'sha256:synthetic-test-notice' },
    create: {
      version: '1.0.0-test',
      contentHash: 'sha256:synthetic-test-notice',
      effectiveDate: new Date('2026-09-04T00:00:00.000Z'),
      createdBy: users[3].id,
    },
  });

  for (const [key, label, displayOrder] of notes) {
    await prisma.nonClinicalNote.upsert({
      where: { key },
      update: { label, displayOrder, active: true },
      create: { key, label, displayOrder, active: true },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
