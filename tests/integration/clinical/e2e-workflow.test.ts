import { describe, it, expect } from 'vitest';
import { patientService, clinicalService } from '../../../src/lib/services';
import { optometrist, receptionist, admin, assistant } from '../../fixtures/actors';
import { validRightEye, validLeftEye, missingAxisWithCylinder } from '../../fixtures/refractions';
import { patientRepository } from '../../../src/modules/patients/repository';

describe('T050 — Flujo E2E Completo de SPEC-001 (Escenarios 5.1 a 5.12)', () => {
  it('ejecuta el ciclo de vida completo de un paciente y su consulta de principio a fin', async () => {
    // 5.1 Registro de paciente nuevo y consentimiento
    const actorOpt = optometrist('req-e2e-01');
    const newPatient = await patientService.create({
      branchId: 'branch-001',
      firstName: 'Guillermo',
      lastName: 'Del Toro',
      birthDate: new Date('1964-10-09'),
      sex: 'male',
      phone: '8715554321',
      email: 'guillermo@example.test',
    }, actorOpt);

    expect(newPatient.folio).toBeDefined();
    expect(newPatient.folio).toMatch(/^[A-Z0-9]{8}$/);

    const consent = await patientService.recordConsent({
      patientId: newPatient.id,
      noticeId: patientRepository.getCurrentPrivacyNotice().id,
      source: 'tablet-gabinete',
    }, actorOpt);
    expect(consent.id).toBeDefined();

    // 5.2 Búsqueda de paciente existente desde mostrador (lista blanca)
    const actorRec = receptionist('req-e2e-02');
    const searchResults = await patientService.search({ name: 'Toro', limit: 10 }, actorRec);
    expect(searchResults.length).toBeGreaterThan(0);
    const found = searchResults.find((p) => p.folio === newPatient.folio);
    expect(found).toBeDefined();
    expect(found?.fullName).toContain('Guillermo');
    expect(found).not.toHaveProperty('allergies'); // Garantía lista blanca

    // 5.3 Apertura de consulta
    const consultation = await clinicalService.open({
      patientId: newPatient.id,
      branchId: 'branch-001',
    }, actorOpt);
    expect(consultation.status).toBe('in_progress');

    // 5.8 (Parte 1) Rechazo de consulta duplicada
    await expect(
      clinicalService.open({ patientId: newPatient.id, branchId: 'branch-001' }, actorOpt)
    ).rejects.toThrow(/already has an in-progress consultation/i);

    // 5.10 Rechazo de refracción inválida (cilindro sin eje)
    await expect(
      clinicalService.addRefraction({
        consultationId: consultation.id,
        ...missingAxisWithCylinder,
        expectedVersion: consultation.version,
      }, actorOpt)
    ).rejects.toThrow(/axis/i);

    // 5.4 Captura de refracción OD y OI
    const refOD = await clinicalService.addRefraction({
      consultationId: consultation.id,
      ...validRightEye,
      expectedVersion: consultation.version,
    }, actorOpt);
    expect(refOD.id).toBeDefined();

    const refOI = await clinicalService.addRefraction({
      consultationId: consultation.id,
      ...validLeftEye,
      expectedVersion: consultation.version,
    }, actorOpt);
    expect(refOI.id).toBeDefined();

    // 5.6 Asignación de nota no clínica antes de cerrar la consulta
    const withNote = await clinicalService.setNonClinicalNote({
      consultationId: consultation.id,
      noteKey: 'follow_up',
      expectedVersion: consultation.version,
    }, actorOpt);
    expect(withNote.nonClinicalNoteKey).toBe('follow_up');

    // 5.5 Emisión de prescripción (crea snapshot y cierra consulta)
    const prescription = await clinicalService.issuePrescription({
      consultationId: consultation.id,
      usage: 'progresivo',
      observations: 'Filtro antirreflejante sugerido',
      expectedVersion: withNote.version,
    }, actorOpt);

    expect(prescription.folio).toBeDefined();
    expect(prescription.usage).toBe('progresivo');
    expect(prescription.rightEyeSnapshot).toBeDefined();
    expect(prescription.leftEyeSnapshot).toBeDefined();

    // 5.6 Consulta de resumen seguro en mostrador
    const safeSummary = await clinicalService.getSafeSummary(consultation.id, actorRec);
    expect(safeSummary.patientName).toContain('Guillermo');
    expect(safeSummary.usage).toBe('progresivo');
    expect(safeSummary.status).toBe('closed');
    expect(safeSummary.nonClinicalNoteKey).toBe('follow_up');
    expect(safeSummary).not.toHaveProperty('refractions'); // No expone datos clínicos

    // 5.7 Enmienda de prescripción sin borrar el original
    const amendment = await clinicalService.amendPrescription({
      prescriptionId: prescription.id,
      usage: 'bifocal',
      amendmentReason: 'Paciente prefiere bifocal por costo',
      expectedVersion: prescription.version,
    }, actorOpt);
    expect(amendment.version).toBe(2);
    expect(amendment.amendedFromId).toBe(prescription.id);

    // 5.11 Acceso no autorizado denegado y auditado (recepcionista intentando leer clínica completa)
    await expect(
      clinicalService.getFullConsultation(consultation.id, actorRec)
    ).rejects.toThrow(/Permission denied/i);

    // 5.8 (Parte 2) Liberación administrativa por admin
    const actorAdmin = admin('req-e2e-03');
    // Para probar releaseConsultation creamos una consulta de prueba
    const patient2 = await patientService.create({
      branchId: 'branch-001',
      firstName: 'Alfonso',
      lastName: 'Cuarón',
      birthDate: new Date('1961-11-28'),
      sex: 'male',
      phone: '8719998877',
    }, actorOpt);
    await patientService.recordConsent({
      patientId: patient2.id,
      noticeId: patientRepository.getCurrentPrivacyNotice().id,
      source: 'web',
    }, actorOpt);
    const consult2 = await clinicalService.open({ patientId: patient2.id, branchId: 'branch-001' }, actorOpt);

    const released = await clinicalService.releaseConsultation({
      consultationId: consult2.id,
      reason: 'Desbloqueo por cierre inesperado de sesión de optometrista',
      expectedVersion: consult2.version,
    }, actorAdmin);
    expect(released.status).toBe('in_progress');

    // 5.9 Abandono de consulta con motivo obligatorio
    const abandoned = await clinicalService.abandon({
      consultationId: consult2.id,
      reason: 'Paciente se retira por emergencia personal',
      expectedVersion: released.version,
    }, actorOpt);
    expect(abandoned.status).toBe('abandoned');
    expect(abandoned.abandonmentReason).toContain('emergencia personal');
  });
});
