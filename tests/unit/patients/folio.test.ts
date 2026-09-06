import { describe, it, expect } from 'vitest';
import { generateFolio } from '../../../src/modules/patients/folio-generator';

describe('RF-002 — Generación determinista de folios', () => {
  it('genera un folio de 8 caracteres alfanuméricos', () => {
    const folio = generateFolio('MX', 1);
    expect(folio).toHaveLength(8);
    expect(folio).toMatch(/^[A-Z0-9]+$/);
  });

  it('es determinista: mismo branch y secuencia producen mismo folio', () => {
    const a = generateFolio('MX', 1);
    const b = generateFolio('MX', 1);
    expect(a).toBe(b);
  });

  it('produce folios únicos para secuencias distintas', () => {
    const folios = new Set<string>();
    for (let i = 1; i <= 100; i += 1) {
      folios.add(generateFolio('MX', i));
    }
    expect(folios.size).toBe(100);
  });

  it('mantiene longitud fija al rellenar secuencias grandes', () => {
    const folio = generateFolio('MX', 999_999);
    expect(folio).toHaveLength(8);
  });

  it('distingue folios entre sucursales con la misma secuencia', () => {
    const mx = generateFolio('MX', 1);
    const gdl = generateFolio('GDL', 1);
    expect(mx).not.toBe(gdl);
  });
});
