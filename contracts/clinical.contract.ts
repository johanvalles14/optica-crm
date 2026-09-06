/**
 * Contrato del módulo clinical para SPEC-001.
 * Define operaciones sobre consultas, refracción, prescripción y resumen seguro.
 */

import type { ActorContext, UserId } from './auth.contract';
import type { BranchId, Folio, Patient, PatientId } from './patients.contract';

export type ConsultationId = string;
export type RefractionId = string;
export type PrescriptionId = string;

export type ConsultationStatus = 'in_progress' | 'closed' | 'abandoned';
export type Eye = 'OD' | 'OI';
export type LensUsage = 'lejos' | 'cerca' | 'bifocal' | 'progresivo' | 'contacto';

/** Claves del catálogo cerrado de notas no clínicas. */
export type NonClinicalNoteKey =
  | 'follow_up'
  | 'external_rx'
  | 'contact_later'
  | 'prefer_phone'
  | 'prefer_email';

/** Etiquetas legibles del catálogo cerrado de notas no clínicas. */
export type NonClinicalNote =
  | 'Paciente solicita cita de seguimiento'
  | 'Paciente trae receta externa'
  | 'Requiere contacto posterior'
  | 'Preferencia de contacto por teléfono'
  | 'Preferencia de contacto por correo';

export interface Consultation {
  id: ConsultationId;
  patientId: PatientId;
  branchId: BranchId;
  status: ConsultationStatus;
  openedAt: Date;
  openedBy: UserId;
  closedAt?: Date;
  closedBy?: UserId;
  abandonmentReason?: string;
  /** Nota no clínica seleccionada del catálogo cerrado. */
  nonClinicalNoteKey?: NonClinicalNoteKey;
  /** Impresión diagnóstica capturada durante la consulta. */
  diagnosis?: string;
  /** Hallazgos y notas clínicas de apoyo para la receta y cotización. */
  clinicalNotes?: string;
  version: number;
}

export interface OpenConsultationInput {
  patientId: PatientId;
  branchId: BranchId;
}

export interface IssuePrescriptionInput {
  consultationId: ConsultationId;
  usage: LensUsage;
  observations?: string;
  expectedVersion: number;
}

export interface AbandonConsultationInput {
  consultationId: ConsultationId;
  reason: string;
  expectedVersion: number;
}

export interface ReleaseConsultationInput {
  consultationId: ConsultationId;
  /** Motivo de la liberación administrativa; queda en auditoría. */
  reason: string;
  expectedVersion: number;
}

export interface SetNonClinicalNoteInput {
  consultationId: ConsultationId;
  /** `null` remueve la nota asignada. */
  noteKey: NonClinicalNoteKey | null;
  expectedVersion: number;
}

export interface UpdateClinicalDetailsInput {
  consultationId: ConsultationId;
  diagnosis?: string;
  clinicalNotes?: string;
  expectedVersion: number;
}

export interface RefractionValue {
  eye: Eye;
  sphere?: number;
  cylinder?: number;
  axis?: number;
  addition?: number;
  visualAcuity?: string;
  visualAcuityDecimal?: number;
  pupillaryDistance?: number;
}

export interface RefractionInput extends RefractionValue {
  consultationId: ConsultationId;
  expectedVersion: number;
}

export interface RefractionAmendmentInput extends RefractionInput {
  amendedFromId: RefractionId;
  amendmentReason: string;
}

export interface Refraction extends RefractionValue {
  id: RefractionId;
  consultationId: ConsultationId;
  isAmendment: boolean;
  amendedFromId?: RefractionId;
  amendmentReason?: string;
  createdBy: UserId;
  createdAt: Date;
}

/** Copia inmutable de los valores refractivos de un ojo al momento de emitir la prescripción. */
export interface PrescriptionRefractionSnapshot extends RefractionValue {}

export interface Prescription {
  id: PrescriptionId;
  consultationId: ConsultationId;
  patientId: PatientId;
  branchId: BranchId;
  folio: string;
  issuedAt: Date;
  issuedBy: UserId;
  usage: LensUsage;
  /** Snapshot inmutable de la refracción OD/OI vigente al momento de la emisión. */
  rightEyeSnapshot: PrescriptionRefractionSnapshot;
  leftEyeSnapshot: PrescriptionRefractionSnapshot;
  /** IDs de los registros Refraction originales usados para el snapshot. */
  snapshotSourceIds: [RefractionId, RefractionId];
  /** Momento de captura del snapshot. */
  snapshotTakenAt: Date;
  observations?: string;
  isAmendment: boolean;
  amendedFromId?: PrescriptionId;
  amendmentReason?: string;
  version: number;
}

export interface PrescriptionAmendmentInput {
  prescriptionId: PrescriptionId;
  usage: LensUsage;
  observations?: string;
  amendmentReason: string;
  expectedVersion: number;
}

/** Lista blanca del resumen seguro para secretaría/mostrador. */
export interface SafeSummary {
  patientName: string;
  folio: Folio;
  consultationDate: Date;
  usage?: LensUsage;
  status: ConsultationStatus;
  nonClinicalNoteKey?: NonClinicalNoteKey;
  nonClinicalNote?: NonClinicalNote;
}

/** Vista mínima de consultas para navegación desde secretaría/mostrador. */
export interface ConsultationSummary {
  consultationId: ConsultationId;
  patientId: PatientId;
  folio: Folio;
  openedAt: Date;
  status: ConsultationStatus;
  usage?: LensUsage;
}

export interface FullConsultation {
  consultation: Consultation;
  patient: Patient;
  refractions: Refraction[];
  prescription?: Prescription;
}

/** Consulta cerrada que recepción puede convertir en cotización. */
export interface ReceptionQueueEntry {
  consultation: Consultation;
  patient: Patient;
  refractions: Refraction[];
  prescription: Prescription;
}

export interface IClinicalService {
  open(input: OpenConsultationInput, actor: ActorContext): Promise<Consultation>;
  issuePrescription(
    input: IssuePrescriptionInput,
    actor: ActorContext
  ): Promise<Prescription>;
  abandon(
    input: AbandonConsultationInput,
    actor: ActorContext
  ): Promise<Consultation>;
  /**
   * Libera una consulta `in_progress` bloqueada por otro usuario.
   * Solo `admin` puede ejecutarla; queda registrado en auditoría.
   */
  releaseConsultation(
    input: ReleaseConsultationInput,
    actor: ActorContext
  ): Promise<Consultation>;
  setNonClinicalNote(
    input: SetNonClinicalNoteInput,
    actor: ActorContext
  ): Promise<Consultation>;
  updateClinicalDetails(
    input: UpdateClinicalDetailsInput,
    actor: ActorContext
  ): Promise<Consultation>;
  addRefraction(input: RefractionInput, actor: ActorContext): Promise<Refraction>;
  amendRefraction(
    input: RefractionAmendmentInput,
    actor: ActorContext
  ): Promise<Refraction>;
  amendPrescription(
    input: PrescriptionAmendmentInput,
    actor: ActorContext
  ): Promise<Prescription>;
  getSafeSummary(
    consultationId: ConsultationId,
    actor: ActorContext
  ): Promise<SafeSummary>;
  getSafeSummaryByPatientId(
    patientId: PatientId,
    actor: ActorContext
  ): Promise<SafeSummary | null>;
  getSafeSummaryByFolio(
    folio: Folio,
    actor: ActorContext
  ): Promise<SafeSummary | null>;
  listConsultationsByPatientId(
    patientId: PatientId,
    actor: ActorContext
  ): Promise<ConsultationSummary[]>;
  listConsultationsByFolio(
    folio: Folio,
    actor: ActorContext
  ): Promise<ConsultationSummary[]>;
  getFullConsultation(
    consultationId: ConsultationId,
    actor: ActorContext
  ): Promise<FullConsultation>;
  listReceptionQueue(actor: ActorContext): Promise<ReceptionQueueEntry[]>;
}
