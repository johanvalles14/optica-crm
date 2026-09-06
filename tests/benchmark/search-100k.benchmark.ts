import { describe, it, expect } from 'vitest';
import { PatientService } from '../../src/modules/patients/service';
import { ClinicalService } from '../../src/modules/clinical/service';
import { generatePatients } from '../fixtures/synthetic-patients';
import { optometrist, receptionist } from '../fixtures/actors';

describe('RF-004 — Benchmark búsqueda y resumen seguro (100k)', () => {
  const patients = new PatientService();
  const clinical = new ClinicalService();

  it('búsqueda por nombre parcial cumple ≤ 500 ms p95', async () => {
    const inputs = generatePatients(100_000);
    await Promise.all(inputs.map((input) => patients.create(input, optometrist(`req-bench-create-${input.phone}`))));

    const times: number[] = [];
    for (let i = 0; i < 20; i += 1) {
      const start = performance.now();
      await patients.search({ name: 'Ana', limit: 20 }, receptionist(`req-bench-search-${i}`));
      times.push(performance.now() - start);
    }

    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)];
    expect(p95).toBeLessThanOrEqual(500);
  });

  it('resumen seguro por folio cumple ≤ 500 ms p95', async () => {
    const times: number[] = [];
    for (let i = 0; i < 20; i += 1) {
      const start = performance.now();
      await clinical.getSafeSummaryByFolio('PT000001', receptionist(`req-bench-summary-${i}`));
      times.push(performance.now() - start);
    }

    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)];
    expect(p95).toBeLessThanOrEqual(500);
  });
});
