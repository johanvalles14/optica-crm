import type { PatientInput } from '../../contracts/patients.contract';

const firstNames = ['Ana', 'Luis', 'Carmen', 'Jorge', 'Diana', 'Pedro', 'Sofía', 'Miguel'];
const lastNames = ['Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez'];

function pad(num: number, size: number): string {
  return num.toString().padStart(size, '0');
}

export function generatePatients(count: number): PatientInput[] {
  const patients: PatientInput[] = [];
  for (let i = 0; i < count; i += 1) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    patients.push({
      branchId: 'branch-001',
      firstName,
      lastName,
      birthDate: new Date(1970 + (i % 50), (i % 12), 1),
      sex: i % 2 === 0 ? 'female' : 'male',
      phone: `871${pad(i % 10_000_000, 7)}`,
      email: `synthetic-${i}@example.test`,
    });
  }
  return patients;
}

export function generateFolios(count: number): string[] {
  const folios: string[] = [];
  for (let i = 0; i < count; i += 1) {
    folios.push(`MX${pad(i + 1, 6)}`);
  }
  return folios;
}
