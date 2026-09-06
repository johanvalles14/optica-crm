/**
 * Contrato del módulo patients para SPEC-001.
 * Define operaciones sobre ficha, contacto y consentimiento.
 */

import type { ActorContext, UserId } from './auth.contract';

export type PatientId = string;
export type Folio = string;
export type BranchId = string;
export type PrivacyNoticeId = string;
export type ConsentId = string;

export type Sex = 'male' | 'female' | 'other' | 'not_specified';
export type PatientStatus = 'active' | 'inactive_for_contact';

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface PatientInput {
  branchId: BranchId;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: Date;
  sex: Sex;
  phone: string;
  email?: string;
  address?: string;
  allergies?: string;
  conditions?: string;
  emergencyContact?: EmergencyContact;
}

export interface Patient {
  id: PatientId;
  folio: Folio;
  branchId: BranchId;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: Date;
  sex: Sex;
  phone: string;
  email?: string;
  address?: string;
  allergies?: string;
  conditions?: string;
  emergencyContact?: EmergencyContact;
  isContactAllowed: boolean;
  status: PatientStatus;
  /** Control de concurrencia para ediciones de ficha. */
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Lista blanca de resultados de búsqueda para roles no clínicos. */
export interface PatientSearchResult {
  folio: Folio;
  fullName: string;
  birthDate: Date;
  maskedPhone: string;
  lastConsultationStatus: 'in_progress' | 'closed' | 'abandoned' | 'none';
}

export interface PrivacyNotice {
  id: PrivacyNoticeId;
  version: string;
  contentHash: string;
  effectiveDate: Date;
}

export interface ConsentInput {
  patientId: PatientId;
  noticeId: PrivacyNoticeId;
  source: string;
}

export interface Consent {
  id: ConsentId;
  patientId: PatientId;
  noticeId: PrivacyNoticeId;
  grantedAt: Date;
  grantedBy: UserId;
  source: string;
  revokedAt?: Date;
}

export interface PatientSearchQuery {
  name?: string;
  phone?: string;
  folio?: Folio;
  limit: number;
}

export interface IPatientService {
  create(input: PatientInput, actor: ActorContext): Promise<Patient>;
  update(
    patientId: PatientId,
    input: Partial<PatientInput>,
    expectedVersion: number,
    actor: ActorContext
  ): Promise<Patient>;
  search(query: PatientSearchQuery, actor: ActorContext): Promise<PatientSearchResult[]>;
  findByFolio(folio: Folio, actor: ActorContext): Promise<Patient | null>;
  findById(patientId: PatientId, actor: ActorContext): Promise<Patient | null>;
  getSummary(folio: Folio, actor: ActorContext): Promise<PatientSearchResult>;
  hasValidConsent(patientId: PatientId, actor: ActorContext): Promise<boolean>;
  recordConsent(input: ConsentInput, actor: ActorContext): Promise<Consent>;
}
