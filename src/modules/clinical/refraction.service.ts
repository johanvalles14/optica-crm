import type { ActorContext } from '../../../contracts/auth.contract';
import type {
  Refraction,
  RefractionAmendmentInput,
  RefractionInput,
} from '../../../contracts/clinical.contract';
import { authorize } from '../auth/rbac';
import { AuditService } from '../audit/service';
import { hasValidConsent } from '../patients/consent.service';
import { patientRepository } from '../patients/repository';
import { clinicalRepository } from './repository';
import { validateRefraction } from './validators';

export class RefractionService {
  private audit = new AuditService();

  async addRefraction(
    input: RefractionInput,
    actor: ActorContext
  ): Promise<Refraction> {
    if (!authorize(actor.role, 'addRefraction', 'Refraction')) {
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

    validateRefraction(input);

    const refraction = clinicalRepository.createRefraction(
      input.consultationId,
      {
        eye: input.eye,
        sphere: input.sphere,
        cylinder: input.cylinder,
        axis: input.axis,
        addition: input.addition,
        visualAcuity: input.visualAcuity,
        visualAcuityDecimal: input.visualAcuityDecimal,
        pupillaryDistance: input.pupillaryDistance,
        isAmendment: false,
      },
      actor.actorId
    );

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'create',
      entity: 'Refraction',
      entityId: refraction.id,
      requestId: actor.requestId,
      metadata: { eye: refraction.eye },
    });

    return refraction;
  }

  async amendRefraction(
    input: RefractionAmendmentInput,
    actor: ActorContext
  ): Promise<Refraction> {
    if (!authorize(actor.role, 'amendRefraction', 'Refraction')) {
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

    const original = clinicalRepository.getRefraction(input.amendedFromId);
    if (!original) throw new Error('Original refraction not found');
    if (original.consultationId !== input.consultationId) {
      throw new Error('Original refraction does not belong to this consultation');
    }

    const notice = patientRepository.getCurrentPrivacyNotice();
    await hasValidConsent(consultation.patientId, {
      currentNoticeId: notice.id,
      blockClinicalWrite: true,
    });

    validateRefraction(input);

    const refraction = clinicalRepository.createRefraction(
      input.consultationId,
      {
        eye: input.eye,
        sphere: input.sphere,
        cylinder: input.cylinder,
        axis: input.axis,
        addition: input.addition,
        visualAcuity: input.visualAcuity,
        visualAcuityDecimal: input.visualAcuityDecimal,
        pupillaryDistance: input.pupillaryDistance,
        isAmendment: true,
        amendedFromId: input.amendedFromId,
        amendmentReason: input.amendmentReason,
      },
      actor.actorId
    );

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'amend',
      entity: 'Refraction',
      entityId: refraction.id,
      requestId: actor.requestId,
      reason: input.amendmentReason,
      metadata: { eye: refraction.eye, amendedFromId: input.amendedFromId },
    });

    return refraction;
  }
}
