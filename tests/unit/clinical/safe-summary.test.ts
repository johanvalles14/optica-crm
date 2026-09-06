import { describe, it, expect } from 'vitest';
import { buildSafeSummary } from '../../../src/modules/clinical/safe-summary.service';
import type { FullConsultation, SafeSummary } from '../../../contracts/clinical.contract';

const fullConsultation: FullConsultation = {
  consultation: {
    id: 'consultation-001',
    patientId: 'patient-001',
    branchId: 'branch-001',
    status: 'closed',
    openedAt: new Date('2026-09-04T10:00:00.000Z'),
    openedBy: 'user-opt-001',
    closedAt: new Date('2026-09-04T10:30:00.000Z'),
    closedBy: 'user-opt-001',
    nonClinicalNoteKey: 'follow_up',
    version: 3,
  },
  refractions: [
    {
      id: 'ref-od-001',
      consultationId: 'consultation-001',
      eye: 'OD',
      sphere: -2.5,
      cylinder: -0.75,
      axis: 180,
      createdBy: 'user-opt-001',
      createdAt: new Date('2026-09-04T10:15:00.000Z'),
      isAmendment: false,
    },
  ],
  prescription: {
    id: 'prescription-001',
    consultationId: 'consultation-001',
    patientId: 'patient-001',
    branchId: 'branch-001',
    folio: 'RX000001',
    issuedAt: new Date('2026-09-04T10:30:00.000Z'),
    issuedBy: 'user-opt-001',
    usage: 'progresivo',
    rightEyeSnapshot: { eye: 'OD', sphere: -2.5, cylinder: -0.75, axis: 180 },
    leftEyeSnapshot: { eye: 'OI', sphere: -2.25, cylinder: -0.5, axis: 175 },
    snapshotSourceIds: ['ref-od-001', 'ref-oi-001'],
    snapshotTakenAt: new Date('2026-09-04T10:30:00.000Z'),
    observations: 'Nota clínica sensible',
    isAmendment: false,
    version: 1,
  },
};

describe('RF-009 — Lista blanca del resumen seguro', () => {
  it('incluye únicamente campos permitidos por la lista blanca', () => {
    const summary: SafeSummary = buildSafeSummary(fullConsultation, {
      patientName: 'Juan Pérez García',
      folio: 'PT000001',
    });

    expect(summary.patientName).toBe('Juan Pérez García');
    expect(summary.folio).toBe('PT000001');
    expect(summary.consultationDate).toEqual(fullConsultation.consultation.openedAt);
    expect(summary.usage).toBe('progresivo');
    expect(summary.status).toBe('closed');
    expect(summary.nonClinicalNoteKey).toBe('follow_up');
  });

  it('no expone graduación, diagnóstico ni observaciones clínicas', () => {
    const summary = buildSafeSummary(fullConsultation, { patientName: 'Juan Pérez García', folio: 'PT000001' });

    expect(summary).not.toHaveProperty('refractions');
    expect(summary).not.toHaveProperty('sphere');
    expect(summary).not.toHaveProperty('cylinder');
    expect(summary).not.toHaveProperty('axis');
    expect(summary).not.toHaveProperty('observations');
    expect(summary).not.toHaveProperty('diagnosis');
  });

  it('no permite notas libres de texto; solo claves del catálogo cerrado', () => {
    expect(() =>
      buildSafeSummary(fullConsultation, { patientName: 'Juan Pérez García', folio: 'PT000001' }, 'nota-libre' as any)
    ).toThrow(/catalog/i);
  });
});
