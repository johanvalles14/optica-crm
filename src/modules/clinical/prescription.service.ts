import type { ActorContext } from '../../../contracts/auth.contract';
import type {
  Consultation,
  IssuePrescriptionInput,
  Prescription,
  PrescriptionAmendmentInput,
  PrescriptionRefractionSnapshot,
  Refraction,
} from '../../../contracts/clinical.contract';
import { authorize } from '../auth/rbac';
import { AuditService } from '../audit/service';
import { hasValidConsent } from '../patients/consent.service';
import { patientRepository } from '../patients/repository';
import { ConsultationStateMachine } from './state-machine';
import { clinicalRepository } from './repository';

const stateMachine = new ConsultationStateMachine();

function toSnapshot(
  refraction: import('../../../contracts/clinical.contract').Refraction
): PrescriptionRefractionSnapshot {
  return {
    eye: refraction.eye,
    sphere: refraction.sphere,
    cylinder: refraction.cylinder,
    axis: refraction.axis,
    addition: refraction.addition,
    visualAcuity: refraction.visualAcuity,
    visualAcuityDecimal: refraction.visualAcuityDecimal,
    pupillaryDistance: refraction.pupillaryDistance,
  };
}

export class PrescriptionService {
  private audit = new AuditService();

  async issuePrescription(
    input: IssuePrescriptionInput,
    actor: ActorContext
  ): Promise<Prescription> {
    if (!authorize(actor.role, 'issuePrescription', 'Prescription')) {
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

    const notice = patientRepository.getCurrentPrivacyNotice();
    await hasValidConsent(consultation.patientId, {
      currentNoticeId: notice.id,
      blockClinicalWrite: true,
    });

    if (!clinicalRepository.hasValidRefractionForBothEyes(input.consultationId)) {
      throw new Error('Valid refraction for both eyes is required');
    }

    const latest = clinicalRepository.getLatestRefractionsByEye(input.consultationId);
    const rightEye = latest.get('OD');
    const leftEye = latest.get('OI');
    if (!rightEye || !leftEye) {
      throw new Error('Valid refraction for both eyes is required');
    }

    const prescription = clinicalRepository.createPrescription(
      {
        consultationId: input.consultationId,
        patientId: consultation.patientId,
        branchId: consultation.branchId,
        issuedAt: new Date(),
        issuedBy: actor.actorId,
        usage: input.usage,
        rightEyeSnapshot: toSnapshot(rightEye),
        leftEyeSnapshot: toSnapshot(leftEye),
        snapshotSourceIds: [rightEye.id, leftEye.id],
        snapshotTakenAt: new Date(),
        observations: input.observations,
        isAmendment: false,
        version: 1,
      },
      consultation.branchId
    );

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'create',
      entity: 'Prescription',
      entityId: prescription.id,
      requestId: actor.requestId,
      metadata: { consultationId: input.consultationId },
    });

    return prescription;
  }

  async issuePrescriptionWithConsultation(
    input: IssuePrescriptionInput,
    actor: ActorContext
  ): Promise<{ prescription: Prescription; consultation: import('../../../contracts/clinical.contract').Consultation }> {
    const prescription = await this.issuePrescription(input, actor);
    const consultation = clinicalRepository.getConsultation(input.consultationId);
    if (!consultation) throw new Error('Consultation not found after prescription');

    const closedStatus = stateMachine.transition('in_progress', 'issuePrescription');
    const closedConsultation = clinicalRepository.updateConsultation(
      consultation,
      input.expectedVersion,
      {
        status: closedStatus,
        closedAt: new Date(),
        closedBy: actor.actorId,
      }
    );

    return { prescription, consultation: closedConsultation };
  }

  async amendPrescription(
    input: PrescriptionAmendmentInput,
    actor: ActorContext
  ): Promise<Prescription> {
    if (!authorize(actor.role, 'amendPrescription', 'Prescription')) {
      throw new Error('Permission denied');
    }

    const original = clinicalRepository.getPrescription(input.prescriptionId);
    if (!original) throw new Error('Original prescription not found');
    if (original.isAmendment) {
      throw new Error('Cannot amend an amendment; amend the base prescription');
    }
    if (original.version !== input.expectedVersion) {
      throw new Error('Stale version: expectedVersion does not match');
    }

    const notice = patientRepository.getCurrentPrivacyNotice();
    await hasValidConsent(original.patientId, {
      currentNoticeId: notice.id,
      blockClinicalWrite: true,
    });

    const consultation = clinicalRepository.getConsultation(original.consultationId);

    const amended = clinicalRepository.createPrescription(
      {
        consultationId: original.consultationId,
        patientId: original.patientId,
        branchId: original.branchId,
        issuedAt: new Date(),
        issuedBy: actor.actorId,
        usage: input.usage,
        rightEyeSnapshot: original.rightEyeSnapshot,
        leftEyeSnapshot: original.leftEyeSnapshot,
        snapshotSourceIds: original.snapshotSourceIds,
        snapshotTakenAt: original.snapshotTakenAt,
        observations: input.observations,
        isAmendment: true,
        amendedFromId: original.id,
        amendmentReason: input.amendmentReason,
        version: original.version + 1,
      },
      original.branchId
    );

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'amend',
      entity: 'Prescription',
      entityId: amended.id,
      requestId: actor.requestId,
      reason: input.amendmentReason,
      metadata: { amendedFromId: original.id },
    });

    return amended;
  }
}
