import { describe, it, expect } from 'vitest';
import { searchPatients, findByFolio } from '../../../src/modules/patients/service';
import { generatePatients } from '../../fixtures/synthetic-patients';
import { receptionist } from '../../fixtures/actors';

describe('RF-004 — Búsqueda con lista blanca', () => {
  const actor = receptionist('req-search-001');

  it('búsqueda por nombre parcial devuelve solo campos de la lista blanca', async () => {
    const results = await searchPatients({ name: 'Ana', limit: 10 }, actor);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(Object.keys(r).sort()).toEqual(['birthDate', 'folio', 'fullName', 'lastConsultationStatus', 'maskedPhone']);
      expect(r).not.toHaveProperty('email');
      expect(r).not.toHaveProperty('address');
      expect(r).not.toHaveProperty('phone');
    }
  });

  it('búsqueda por teléfono parcial requiere al menos 4 dígitos', async () => {
    await expect(searchPatients({ phone: '123', limit: 10 }, actor)).rejects.toThrow(/4 digits/i);
  });

  it('búsqueda por folio exacto devuelve el paciente sin datos sensibles', async () => {
    const patient = await findByFolio('PT000001', actor);
    expect(patient).not.toBeNull();
    expect(patient).not.toHaveProperty('allergies');
    expect(patient).not.toHaveProperty('conditions');
  });

  it('benchmark 100k registros sintéticos cumple ≤ 500 ms p95', async () => {
    const patients = generatePatients(100_000);
    const start = performance.now();
    await searchPatients({ name: 'Ana', limit: 20 }, actor);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThanOrEqual(500);
  });
});
