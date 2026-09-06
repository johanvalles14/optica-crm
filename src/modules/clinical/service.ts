import type { ActorContext } from '../../../contracts/auth.contract';
import type {
  BranchId,
  Folio,
  PatientId,
} from '../../../contracts/patients.contract';
import type {
  AbandonConsultationInput,
  Consultation,
  ConsultationId,
  ConsultationSummary,
  FullConsultation,
  IClinicalService,
  IssuePrescriptionInput,
  OpenConsultationInput,
  Prescription,
  PrescriptionAmendmentInput,
  ReceptionQueueEntry,
  Refraction,
  RefractionAmendmentInput,
  RefractionInput,
  ReleaseConsultationInput,
  SafeSummary,
  SetNonClinicalNoteInput,
  UpdateClinicalDetailsInput,
} from '../../../contracts/clinical.contract';
import { authorize } from '../auth/rbac';
import { AuditService } from '../audit/service';
import { patientRepository } from '../patients/repository';
import { buildSafeSummary } from './safe-summary.service';
import { assertNonClinicalNoteKey } from './non-clinical-notes';
import { ConsultationStateMachine } from './state-machine';
import { clinicalRepository } from './repository';
import { RefractionService } from './refraction.service';
import { PrescriptionService } from './prescription.service';
import { salesRepository } from '../sales/repository';

const stateMachine = new ConsultationStateMachine();

export class ClinicalService implements IClinicalService {
  private audit = new AuditService();
  private refractionService = new RefractionService();
  private prescriptionService = new PrescriptionService();

  async open(
    input: OpenConsultationInput,
    actor: ActorContext
  ): Promise<Consultation> {
    if (!authorize(actor.role, 'open', 'Consultation')) {
      throw new Error('Permission denied');
    }

    const patient = patientRepository.getPatient(input.patientId);
    if (!patient) throw new Error('Patient not found');

    if (clinicalRepository.hasInProgressConsultation(input.patientId)) {
      throw new Error('Patient already has an in-progress consultation');
    }

    const consultation = clinicalRepository.createConsultation(
      input.patientId,
      input.branchId,
      actor.actorId
    );

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'create',
      entity: 'Consultation',
      entityId: consultation.id,
      requestId: actor.requestId,
    });

    return consultation;
  }

  async abandon(
    input: AbandonConsultationInput,
    actor: ActorContext
  ): Promise<Consultation> {
    if (!authorize(actor.role, 'abandon', 'Consultation')) {
      throw new Error('Permission denied');
    }

    const consultation = clinicalRepository.getConsultation(input.consultationId);
    if (!consultation) throw new Error('Consultation not found');
    if (consultation.status !== 'in_progress') {
      throw new Error('Consultation is not in progress');
    }
    if (consultation.openedBy !== actor.actorId) {
      throw new Error('Only the responsible optometrist can abandon this consultation');
    }

    const abandonedStatus = stateMachine.transition('in_progress', 'abandon');
    const updated = clinicalRepository.updateConsultation(
      consultation,
      input.expectedVersion,
      {
        status: abandonedStatus,
        abandonmentReason: input.reason,
        closedAt: new Date(),
        closedBy: actor.actorId,
      }
    );

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'update',
      entity: 'Consultation',
      entityId: updated.id,
      requestId: actor.requestId,
      reason: input.reason,
    });

    return updated;
  }

  async releaseConsultation(
    input: ReleaseConsultationInput,
    actor: ActorContext
  ): Promise<Consultation> {
    if (!authorize(actor.role, 'releaseConsultation', 'Consultation')) {
      throw new Error('Permission denied: only admin can release a blocked consultation');
    }

    const consultation = clinicalRepository.getConsultation(input.consultationId);
    if (!consultation) throw new Error('Consultation not found');
    if (consultation.status !== 'in_progress') {
      throw new Error('Consultation is not in progress');
    }
    if (consultation.version !== input.expectedVersion) {
      throw new Error('Stale version: expectedVersion does not match');
    }

    const updated = clinicalRepository.updateConsultation(
      consultation,
      input.expectedVersion,
      { openedBy: consultation.openedBy }
    );

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'update',
      entity: 'Consultation',
      entityId: updated.id,
      requestId: actor.requestId,
      reason: input.reason,
      metadata: { releasedByAdmin: true },
    });

    return updated;
  }

  async takeOwnership(
    input: { consultationId: ConsultationId; expectedVersion: number },
    actor: ActorContext
  ): Promise<Consultation> {
    if (!authorize(actor.role, 'takeOwnership', 'Consultation')) {
      throw new Error('Permission denied');
    }

    const consultation = clinicalRepository.getConsultation(input.consultationId);
    if (!consultation) throw new Error('Consultation not found');
    if (consultation.status !== 'in_progress') {
      throw new Error('Consultation is not in progress');
    }
    if (consultation.version !== input.expectedVersion) {
      throw new Error('Stale version: expectedVersion does not match');
    }

    const updated = clinicalRepository.updateConsultation(
      consultation,
      input.expectedVersion,
      { openedBy: actor.actorId }
    );

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'update',
      entity: 'Consultation',
      entityId: updated.id,
      requestId: actor.requestId,
    });

    return updated;
  }

  async setNonClinicalNote(
    input: SetNonClinicalNoteInput,
    actor: ActorContext
  ): Promise<Consultation> {
    if (!authorize(actor.role, 'setNonClinicalNote', 'Consultation')) {
      throw new Error('Permission denied');
    }

    const consultation = clinicalRepository.getConsultation(input.consultationId);
    if (!consultation) throw new Error('Consultation not found');
    if (stateMachine.isFinal(consultation.status)) {
      throw new Error('Cannot edit consultation in final state');
    }
    if (consultation.version !== input.expectedVersion) {
      throw new Error('Stale version: expectedVersion does not match');
    }

    if (input.noteKey !== null) {
      assertNonClinicalNoteKey(input.noteKey);
    }

    const updated = clinicalRepository.updateConsultation(
      consultation,
      input.expectedVersion,
      {
        nonClinicalNoteKey: input.noteKey === null ? undefined : input.noteKey,
      }
    );

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'update',
      entity: 'Consultation',
      entityId: updated.id,
      requestId: actor.requestId,
      metadata: { noteKey: input.noteKey },
    });

    return updated;
  }

  async updateClinicalDetails(
    input: UpdateClinicalDetailsInput,
    actor: ActorContext
  ): Promise<Consultation> {
    if (!authorize(actor.role, 'updateClinicalDetails', 'Consultation')) {
      throw new Error('Permission denied');
    }

    const consultation = clinicalRepository.getConsultation(input.consultationId);
    if (!consultation) throw new Error('Consultation not found');
    if (consultation.status !== 'in_progress') {
      throw new Error('Clinical details can only be edited while the consultation is in progress');
    }
    if (consultation.version !== input.expectedVersion) {
      throw new Error('Stale version: expectedVersion does not match');
    }

    const diagnosis = input.diagnosis?.trim();
    const clinicalNotes = input.clinicalNotes?.trim();
    if (diagnosis && diagnosis.length > 2000) throw new Error('Diagnosis exceeds 2000 characters');
    if (clinicalNotes && clinicalNotes.length > 4000) throw new Error('Clinical notes exceed 4000 characters');

    const changes: Partial<Consultation> = {};
    if (input.diagnosis !== undefined) changes.diagnosis = diagnosis || undefined;
    if (input.clinicalNotes !== undefined) changes.clinicalNotes = clinicalNotes || undefined;

    const updated = clinicalRepository.updateConsultation(
      consultation,
      input.expectedVersion,
      changes
    );

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'update',
      entity: 'Consultation',
      entityId: updated.id,
      requestId: actor.requestId,
      metadata: {
        hasDiagnosis: Boolean(updated.diagnosis),
        hasClinicalNotes: Boolean(updated.clinicalNotes),
      },
    });

    return updated;
  }

  async addRefraction(
    input: RefractionInput,
    actor: ActorContext
  ): Promise<Refraction> {
    return this.refractionService.addRefraction(input, actor);
  }

  async amendRefraction(
    input: RefractionAmendmentInput,
    actor: ActorContext
  ): Promise<Refraction> {
    return this.refractionService.amendRefraction(input, actor);
  }

  async issuePrescription(
    input: IssuePrescriptionInput,
    actor: ActorContext
  ): Promise<Prescription> {
    const { prescription } = await this.prescriptionService.issuePrescriptionWithConsultation(input, actor);
    return prescription;
  }

  async amendPrescription(
    input: PrescriptionAmendmentInput,
    actor: ActorContext
  ): Promise<Prescription> {
    return this.prescriptionService.amendPrescription(input, actor);
  }

  async getSafeSummary(
    consultationId: ConsultationId,
    actor: ActorContext
  ): Promise<SafeSummary> {
    if (!authorize(actor.role, 'getSafeSummary', 'SafeSummary')) {
      throw new Error('Permission denied');
    }

    const full = clinicalRepository.buildFullConsultation(consultationId);
    if (!full) throw new Error('Consultation not found');

    const patient = patientRepository.getPatient(full.consultation.patientId);
    if (!patient) throw new Error('Patient not found');

    return buildSafeSummary(full, {
      patientName: [patient.firstName, patient.middleName, patient.lastName]
        .filter(Boolean)
        .join(' '),
      folio: patient.folio,
    });
  }

  async getSafeSummaryByPatientId(
    patientId: PatientId,
    actor: ActorContext
  ): Promise<SafeSummary | null> {
    if (!authorize(actor.role, 'getSafeSummary', 'SafeSummary')) {
      throw new Error('Permission denied');
    }

    const consultations = clinicalRepository.listConsultationsByPatientId(patientId);
    if (consultations.length === 0) return null;
    return this.getSafeSummary(consultations[0].id, actor);
  }

  async getSafeSummaryByFolio(
    folio: Folio,
    actor: ActorContext
  ): Promise<SafeSummary | null> {
    if (!authorize(actor.role, 'getSafeSummary', 'SafeSummary')) {
      throw new Error('Permission denied');
    }

    const patient = patientRepository.getPatientByFolio(folio);
    if (!patient) return null;
    return this.getSafeSummaryByPatientId(patient.id, actor);
  }

  async listConsultationsByPatientId(
    patientId: PatientId,
    actor: ActorContext
  ): Promise<ConsultationSummary[]> {
    if (!authorize(actor.role, 'listConsultations', 'SafeSummary')) {
      throw new Error('Permission denied');
    }

    const patient = patientRepository.getPatient(patientId);
    if (!patient) return [];

    const consultations = clinicalRepository.listConsultationsByPatientId(patientId);
    return consultations.map((c) => this.toConsultationSummary(c, patient.folio));
  }

  async listConsultationsByFolio(
    folio: Folio,
    actor: ActorContext
  ): Promise<ConsultationSummary[]> {
    if (!authorize(actor.role, 'listConsultations', 'SafeSummary')) {
      throw new Error('Permission denied');
    }

    const patient = patientRepository.getPatientByFolio(folio);
    if (!patient) return [];
    return this.listConsultationsByPatientId(patient.id, actor);
  }

  async getFullConsultation(
    consultationId: ConsultationId,
    actor: ActorContext
  ): Promise<FullConsultation> {
    if (!authorize(actor.role, 'read', 'FullConsultation')) {
      throw new Error('Permission denied');
    }

    const full = clinicalRepository.buildFullConsultation(consultationId);
    if (!full) throw new Error('Consultation not found');

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'read',
      entity: 'FullConsultation',
      entityId: consultationId,
      requestId: actor.requestId,
    });

    return full;
  }

  async listReceptionQueue(actor: ActorContext): Promise<ReceptionQueueEntry[]> {
    if (!authorize(actor.role, 'listConsultations', 'SafeSummary')) {
      throw new Error('Permission denied');
    }

    return clinicalRepository.listClosedConsultations().flatMap((consultation) => {
      const full = clinicalRepository.buildFullConsultation(consultation.id);
      if (!full?.prescription || salesRepository.hasActiveOrderForPrescription(full.prescription.id)) {
        return [];
      }
      return [{ ...full, prescription: full.prescription }];
    });
  }

  async getAuditTrail(consultationId: ConsultationId): Promise<import('../audit/types').AuditEntry[]> {
    return this.audit.findByEntity('Consultation', consultationId);
  }

  private toConsultationSummary(
    consultation: Consultation,
    folio: Folio
  ): ConsultationSummary {
    const prescription = clinicalRepository.getBasePrescriptionByConsultation(
      consultation.id
    );
    return {
      consultationId: consultation.id,
      patientId: consultation.patientId,
      folio,
      openedAt: consultation.openedAt,
      status: consultation.status,
      usage: prescription?.usage,
    };
  }
}
