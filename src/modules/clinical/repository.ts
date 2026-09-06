import { randomUUID } from 'node:crypto';
import type { UserId } from '../../../contracts/auth.contract';
import type {
  BranchId,
  Folio,
  PatientId,
} from '../../../contracts/patients.contract';
import type {
  Consultation,
  ConsultationId,
  ConsultationStatus,
  Eye,
  FullConsultation,
  Prescription,
  PrescriptionId,
  PrescriptionRefractionSnapshot,
  Refraction,
  RefractionId,
} from '../../../contracts/clinical.contract';
import { generateFolio } from '../patients/folio-generator';
import { patientRepository } from '../patients/repository';

class ClinicalRepository {
  private consultations = new Map<ConsultationId, Consultation>();
  private refractions = new Map<RefractionId, Refraction>();
  private prescriptions = new Map<PrescriptionId, Prescription>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const now = new Date('2026-09-04T10:00:00.000Z');

    const consultationSeeds: Array<[ConsultationId, PatientId, ConsultationStatus, number, string?]> = [
      ['consultation-001', 'patient-002', 'in_progress', 1],
      ['consultation-locked', 'patient-006', 'in_progress', 1],
      ['consultation-blocked', 'patient-007', 'in_progress', 1],
      ['consultation-concurrent', 'patient-008', 'in_progress', 2],
      ['consultation-rx', 'patient-009', 'in_progress', 2],
      ['consultation-rx-close', 'patient-010', 'in_progress', 2],
      ['consultation-incomplete', 'patient-011', 'in_progress', 1],
      ['consultation-002', 'patient-012', 'in_progress', 1],
      ['consultation-003', 'patient-013', 'in_progress', 1],
      ['consultation-004', 'patient-014', 'in_progress', 1],
      ['consultation-amend', 'patient-015', 'in_progress', 2],
      ['consultation-no-consent', 'patient-no-consent', 'in_progress', 1],
      ['consultation-old-consent', 'patient-with-old-consent', 'in_progress', 1],
      ['consultation-005', 'patient-016', 'in_progress', 1],
      ['consultation-perm', 'patient-017', 'in_progress', 1],
      ['consultation-perm-blocked', 'patient-018', 'in_progress', 1],
      ['consultation-rx-base', 'patient-019', 'closed', 3],
    ];

    for (const [id, patientId, status, version, reason] of consultationSeeds) {
      const patient = patientRepository.getPatient(patientId);
      const consultation: Consultation = {
        id,
        patientId,
        branchId: patient?.branchId ?? 'branch-001',
        status,
        openedAt: now,
        openedBy: 'user-opt-001',
        abandonmentReason: reason,
        version,
      };
      this.consultations.set(id, consultation);
    }

    const refractionSeeds: Array<[RefractionId, ConsultationId, Eye, Partial<Refraction>]> = [
      [
        'ref-od-rx',
        'consultation-rx',
        'OD',
        { sphere: -2.5, cylinder: -0.75, axis: 180, addition: 0, visualAcuity: '20/20', visualAcuityDecimal: 1.0, pupillaryDistance: 62 },
      ],
      [
        'ref-oi-rx',
        'consultation-rx',
        'OI',
        { sphere: -2.25, cylinder: -0.5, axis: 175, addition: 0, visualAcuity: '20/20', visualAcuityDecimal: 1.0, pupillaryDistance: 62 },
      ],
      [
        'ref-od-rx-close',
        'consultation-rx-close',
        'OD',
        { sphere: -2.5, cylinder: -0.75, axis: 180, addition: 0, visualAcuity: '20/20', visualAcuityDecimal: 1.0, pupillaryDistance: 62 },
      ],
      [
        'ref-oi-rx-close',
        'consultation-rx-close',
        'OI',
        { sphere: -2.25, cylinder: -0.5, axis: 175, addition: 0, visualAcuity: '20/20', visualAcuityDecimal: 1.0, pupillaryDistance: 62 },
      ],
      [
        'ref-od-original',
        'consultation-amend',
        'OD',
        { sphere: -2.5, cylinder: -0.75, axis: 180, addition: 0, visualAcuity: '20/20', visualAcuityDecimal: 1.0, pupillaryDistance: 62 },
      ],
      [
        'ref-od-001',
        'consultation-old-consent',
        'OD',
        { sphere: -2, cylinder: 0, axis: 0, addition: 0, visualAcuity: '20/20', visualAcuityDecimal: 1.0, pupillaryDistance: 62 },
      ],
    ];

    for (const [id, consultationId, eye, partial] of refractionSeeds) {
      const refraction: Refraction = {
        id,
        consultationId,
        eye,
        sphere: partial.sphere,
        cylinder: partial.cylinder,
        axis: partial.axis,
        addition: partial.addition,
        visualAcuity: partial.visualAcuity,
        visualAcuityDecimal: partial.visualAcuityDecimal,
        pupillaryDistance: partial.pupillaryDistance,
        isAmendment: false,
        createdBy: 'user-opt-001',
        createdAt: now,
      };
      this.refractions.set(id, refraction);
    }

    const prescriptionBase: Prescription = {
      id: 'prescription-base-001',
      consultationId: 'consultation-rx-base',
      patientId: 'patient-019',
      branchId: 'branch-001',
      folio: generateFolio('RX', 1),
      issuedAt: now,
      issuedBy: 'user-opt-001',
      usage: 'progresivo',
      rightEyeSnapshot: { eye: 'OD', sphere: -2.5, cylinder: -0.75, axis: 180 },
      leftEyeSnapshot: { eye: 'OI', sphere: -2.25, cylinder: -0.5, axis: 175 },
      snapshotSourceIds: ['ref-od-rx', 'ref-oi-rx'],
      snapshotTakenAt: now,
      observations: 'Prescripción base de prueba',
      isAmendment: false,
      version: 1,
    };
    this.prescriptions.set(prescriptionBase.id, prescriptionBase);
  }

  private generatePrescriptionFolio(branchId: BranchId): Folio {
    const sequence = patientRepository.reservePrescriptionSequence(branchId);
    return generateFolio('RX', sequence);
  }

  getConsultation(id: ConsultationId): Consultation | undefined {
    return this.consultations.get(id);
  }

  listConsultationsByPatientId(patientId: PatientId): Consultation[] {
    return Array.from(this.consultations.values())
      .filter((c) => c.patientId === patientId)
      .sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime());
  }

  listClosedConsultations(): Consultation[] {
    return Array.from(this.consultations.values())
      .filter((consultation) => consultation.status === 'closed')
      .sort((a, b) => (b.closedAt?.getTime() ?? 0) - (a.closedAt?.getTime() ?? 0));
  }

  hasInProgressConsultation(patientId: PatientId): boolean {
    return Array.from(this.consultations.values()).some(
      (c) => c.patientId === patientId && c.status === 'in_progress'
    );
  }

  createConsultation(
    patientId: PatientId,
    branchId: BranchId,
    openedBy: UserId
  ): Consultation {
    const now = new Date();
    const consultation: Consultation = {
      id: randomUUID(),
      patientId,
      branchId,
      status: 'in_progress',
      openedAt: now,
      openedBy,
      version: 1,
    };
    this.consultations.set(consultation.id, consultation);
    return consultation;
  }

  updateConsultation(
    consultation: Consultation,
    expectedVersion: number,
    changes: Partial<Consultation>
  ): Consultation {
    const current = this.consultations.get(consultation.id);
    if (!current) throw new Error('Consultation not found');
    if (current.version !== expectedVersion) {
      throw new Error('Stale version: expectedVersion does not match');
    }
    const updated: Consultation = {
      ...current,
      ...changes,
      version: current.version + 1,
    };
    this.consultations.set(updated.id, updated);
    return updated;
  }

  setConsultation(consultation: Consultation): void {
    this.consultations.set(consultation.id, consultation);
  }

  getRefraction(id: RefractionId): Refraction | undefined {
    return this.refractions.get(id);
  }

  getRefractionsByConsultation(consultationId: ConsultationId): Refraction[] {
    return Array.from(this.refractions.values())
      .filter((r) => r.consultationId === consultationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getLatestRefractionsByEye(
    consultationId: ConsultationId
  ): Map<Eye, Refraction> {
    const latest = new Map<Eye, Refraction>();
    const refs = this.getRefractionsByConsultation(consultationId);
    for (const ref of refs) {
      latest.set(ref.eye, ref);
    }
    return latest;
  }

  hasValidRefractionForBothEyes(consultationId: ConsultationId): boolean {
    const latest = this.getLatestRefractionsByEye(consultationId);
    return latest.has('OD') && latest.has('OI');
  }

  createRefraction(
    consultationId: ConsultationId,
    value: Omit<Refraction, 'id' | 'consultationId' | 'createdBy' | 'createdAt'>,
    createdBy: UserId
  ): Refraction {
    const refraction: Refraction = {
      id: randomUUID(),
      consultationId,
      ...value,
      createdBy,
      createdAt: new Date(),
    } as Refraction;
    this.refractions.set(refraction.id, refraction);
    return refraction;
  }

  createPrescription(
    input: Omit<Prescription, 'id' | 'folio'>,
    branchId: BranchId
  ): Prescription {
    const prescription: Prescription = {
      ...input,
      id: randomUUID(),
      folio: this.generatePrescriptionFolio(branchId),
    };
    this.prescriptions.set(prescription.id, prescription);
    return prescription;
  }

  getPrescription(id: PrescriptionId): Prescription | undefined {
    return this.prescriptions.get(id);
  }

  getPrescriptionsByConsultation(
    consultationId: ConsultationId
  ): Prescription[] {
    return Array.from(this.prescriptions.values())
      .filter((p) => p.consultationId === consultationId)
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
  }

  getBasePrescriptionByConsultation(
    consultationId: ConsultationId
  ): Prescription | undefined {
    return Array.from(this.prescriptions.values()).find(
      (p) => p.consultationId === consultationId && !p.isAmendment
    );
  }

  buildFullConsultation(
    consultationId: ConsultationId
  ): FullConsultation | undefined {
    const consultation = this.consultations.get(consultationId);
    if (!consultation) return undefined;
    const patient = patientRepository.getPatient(consultation.patientId);
    if (!patient) return undefined;
    return {
      consultation,
      patient,
      refractions: this.getRefractionsByConsultation(consultationId),
      prescription: this.getBasePrescriptionByConsultation(consultationId),
    };
  }
}

export const clinicalRepository = new ClinicalRepository();
