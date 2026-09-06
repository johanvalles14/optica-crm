import { describe, it, expect } from 'vitest';
import { PatientService } from '../../../src/modules/patients/service';
import { ClinicalService } from '../../../src/modules/clinical/service';
import { optometrist, assistant, receptionist, admin } from '../../fixtures/actors';
import { makePatientInput } from '../../fixtures/patients';

describe('RF-010 / matriz de roles — Permisos por rol', () => {
  const patients = new PatientService();
  const clinical = new ClinicalService();

  it('optometrista puede crear paciente y abrir consulta', async () => {
    const patient = await patients.create(makePatientInput(), optometrist('req-perm-opt-001'));
    const consultation = await clinical.open(
      { patientId: patient.id, branchId: 'branch-001' },
      optometrist('req-perm-opt-002')
    );
    expect(consultation.status).toBe('in_progress');
  });

  it('asistente no puede emitir prescripción', async () => {
    await expect(
      clinical.issuePrescription(
        { consultationId: 'consultation-perm', usage: 'lejos', expectedVersion: 1 },
        assistant('req-perm-ast-001')
      )
    ).rejects.toThrow(/permission/i);
  });

  it('asistente no puede capturar refracción', async () => {
    await expect(
      clinical.addRefraction(
        { consultationId: 'consultation-perm', eye: 'OD', sphere: -2, cylinder: 0, axis: 0, expectedVersion: 1 },
        assistant('req-perm-ast-002')
      )
    ).rejects.toThrow(/permission/i);
  });

  it('secretaría no puede ver expediente clínico completo', async () => {
    await expect(
      clinical.getFullConsultation('consultation-perm', receptionist('req-perm-rec-001'))
    ).rejects.toThrow(/permission|403|404/i);
  });

  it('secretaría no puede emitir prescripción', async () => {
    await expect(
      clinical.issuePrescription(
        { consultationId: 'consultation-perm', usage: 'lejos', expectedVersion: 1 },
        receptionist('req-perm-rec-002')
      )
    ).rejects.toThrow(/permission/i);
  });

  it('admin puede liberar consulta bloqueada', async () => {
    const released = await clinical.releaseConsultation(
      { consultationId: 'consultation-perm-blocked', reason: 'Liberación administrativa', expectedVersion: 1 },
      admin('req-perm-adm-001')
    );
    expect(released.status).toBe('in_progress');
  });

  it('optometrista no puede liberar consulta bloqueada', async () => {
    await expect(
      clinical.releaseConsultation(
        { consultationId: 'consultation-perm-blocked', reason: 'Intento no autorizado', expectedVersion: 1 },
        optometrist('req-perm-opt-003')
      )
    ).rejects.toThrow(/permission|admin/i);
  });
});
