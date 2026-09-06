import { describe, it, expect } from 'vitest';
import { authorize } from '../../../src/modules/auth/rbac';

describe('RF-010 — RBAC: matriz de operaciones por rol', () => {
  it('optometrista puede realizar operaciones clínicas', () => {
    expect(authorize('clinical:optometrist', 'create', 'Patient')).toBe(true);
    expect(authorize('clinical:optometrist', 'open', 'Consultation')).toBe(true);
    expect(authorize('clinical:optometrist', 'addRefraction', 'Refraction')).toBe(true);
    expect(authorize('clinical:optometrist', 'issuePrescription', 'Prescription')).toBe(true);
  });

  it('asistente puede crear/editar paciente pero no operaciones clínicas avanzadas', () => {
    expect(authorize('clinical:assistant', 'create', 'Patient')).toBe(true);
    expect(authorize('clinical:assistant', 'update', 'Patient')).toBe(true);
    expect(authorize('clinical:assistant', 'addRefraction', 'Refraction')).toBe(false);
    expect(authorize('clinical:assistant', 'issuePrescription', 'Prescription')).toBe(false);
  });

  it('secretaría solo puede buscar paciente y ver resumen seguro', () => {
    expect(authorize('frontdesk:receptionist', 'search', 'Patient')).toBe(true);
    expect(authorize('frontdesk:receptionist', 'getSafeSummary', 'Consultation')).toBe(true);
    expect(authorize('frontdesk:receptionist', 'read', 'FullConsultation')).toBe(false);
    expect(authorize('frontdesk:receptionist', 'addRefraction', 'Refraction')).toBe(false);
    expect(authorize('frontdesk:receptionist', 'issuePrescription', 'Prescription')).toBe(false);
  });

  it('solo admin puede liberar consulta bloqueada', () => {
    expect(authorize('admin', 'releaseConsultation', 'Consultation')).toBe(true);
    expect(authorize('clinical:optometrist', 'releaseConsultation', 'Consultation')).toBe(false);
    expect(authorize('clinical:assistant', 'releaseConsultation', 'Consultation')).toBe(false);
    expect(authorize('frontdesk:receptionist', 'releaseConsultation', 'Consultation')).toBe(false);
  });
});
