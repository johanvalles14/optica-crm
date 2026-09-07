import { randomUUID } from 'node:crypto';
import type {
  ActorContext,
  UserId,
} from '../../../contracts/auth.contract';
import type {
  Consent,
  ConsentInput,
  Folio,
  Patient,
  PatientId,
  PatientInput,
  PatientSearchQuery,
  PatientSearchResult,
} from '../../../contracts/patients.contract';
import type { IPatientService } from '../../../contracts/patients.contract';
import { AuditService } from '../audit/service';
import { authorize } from '../auth/rbac';
import { hasValidConsent } from './consent.service';
import { patientRepository } from './repository';
import { validatePatientInput, validatePatientUpdate } from './validators';

function toSafePatient(patient: Patient): Patient {
  return {
    id: patient.id,
    folio: patient.folio,
    branchId: patient.branchId,
    firstName: patient.firstName,
    lastName: patient.lastName,
    middleName: patient.middleName,
    birthDate: patient.birthDate,
    sex: patient.sex,
    phone: patient.phone,
    isContactAllowed: patient.isContactAllowed,
    status: patient.status,
    version: patient.version,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };
}

export async function searchPatients(
  query: PatientSearchQuery,
  actor: ActorContext
): Promise<PatientSearchResult[]> {
  if (!authorize(actor.role, 'search', 'Patient')) {
    throw new Error('Permission denied');
  }
  return patientRepository.searchPatients(query, () => 'none');
}

export async function findByFolio(
  folio: Folio,
  actor: ActorContext
): Promise<Patient | null> {
  if (!authorize(actor.role, 'search', 'Patient')) {
    throw new Error('Permission denied');
  }
  const patient = patientRepository.getPatientByFolio(folio);
  if (!patient) return null;
  return toSafePatient(patient);
}

export class PatientService implements IPatientService {
  private audit = new AuditService();

  async create(input: PatientInput, actor: ActorContext): Promise<Patient> {
    if (!authorize(actor.role, 'create', 'Patient')) {
      throw new Error('Permission denied');
    }
    validatePatientInput(input);
    const patient = patientRepository.createPatient(input, actor.actorId);
    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'create',
      entity: 'Patient',
      entityId: patient.id,
      requestId: actor.requestId,
    });
    return patient;
  }

  async update(
    patientId: PatientId,
    input: Partial<PatientInput>,
    expectedVersion: number,
    actor: ActorContext
  ): Promise<Patient> {
    if (!authorize(actor.role, 'update', 'Patient')) {
      throw new Error('Permission denied');
    }
    validatePatientUpdate(input);
    const patient = patientRepository.updatePatient(
      patientId,
      input,
      expectedVersion
    );
    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'update',
      entity: 'Patient',
      entityId: patient.id,
      requestId: actor.requestId,
    });
    return patient;
  }

  async search(
    query: PatientSearchQuery,
    actor: ActorContext
  ): Promise<PatientSearchResult[]> {
    return searchPatients(query, actor);
  }

  async findByFolio(
    folio: Folio,
    actor: ActorContext
  ): Promise<Patient | null> {
    return findByFolio(folio, actor);
  }

  async findById(
    patientId: PatientId,
    actor: ActorContext
  ): Promise<Patient | null> {
    if (!authorize(actor.role, 'search', 'Patient')) {
      throw new Error('Permission denied');
    }
    const patient = patientRepository.getPatient(patientId);
    return patient ? toSafePatient(patient) : null;
  }

  async getSummary(
    folio: Folio,
    actor: ActorContext
  ): Promise<PatientSearchResult> {
    if (!authorize(actor.role, 'getSafeSummary', 'SafeSummary')) {
      throw new Error('Permission denied');
    }
    const patient = patientRepository.getPatientByFolio(folio);
    if (!patient) throw new Error('Patient not found');
    return {
      folio: patient.folio,
      fullName: [patient.firstName, patient.middleName, patient.lastName]
        .filter(Boolean)
        .join(' '),
      birthDate: patient.birthDate,
      maskedPhone: `***${patient.phone.slice(-4)}`,
      lastConsultationStatus: 'none',
    };
  }

  async hasValidConsent(
    patientId: PatientId,
    actor: ActorContext
  ): Promise<boolean> {
    if (!authorize(actor.role, 'search', 'Patient')) {
      throw new Error('Permission denied');
    }
    const notice = patientRepository.getCurrentPrivacyNotice();
    return hasValidConsent(patientId, { currentNoticeId: notice.id });
  }

  async recordConsent(
    input: ConsentInput,
    actor: ActorContext
  ): Promise<Consent> {
    if (!authorize(actor.role, 'update', 'Patient')) {
      throw new Error('Permission denied');
    }
    if (!input.source.trim() || input.source.length > 120) {
      throw new Error('Invalid consent source');
    }
    if (input.noticeId !== patientRepository.getCurrentPrivacyNotice().id) {
      throw new Error('Privacy notice is not current');
    }
    const consent = patientRepository.recordConsent(input, actor.actorId);
    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'create',
      entity: 'Consent',
      entityId: consent.id,
      requestId: actor.requestId,
    });
    return consent;
  }
}

export function createPatientId(): PatientId {
  return randomUUID();
}

export type { UserId };
