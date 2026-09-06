import type { Prisma } from '@prisma/client';
import type { ActorContext } from '../../../contracts/auth.contract';
import type { Folio, PatientId } from '../../../contracts/patients.contract';
import type {
  AbandonConsultationInput,
  Consultation,
  ConsultationId,
  ConsultationSummary,
  Eye,
  FullConsultation,
  IssuePrescriptionInput,
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
import { prisma } from '../../lib/prisma';
import { authorize } from '../auth/rbac';
import { AuditService } from '../audit/service';
import { PrismaPatientRepository } from '../patients/prisma-repository';
import { generateFolio } from '../patients/folio-generator';
import { assertNonClinicalNoteKey } from './non-clinical-notes';
import { validateRefraction } from './validators';

const noteLabels = {
  follow_up: 'Paciente solicita cita de seguimiento',
  external_rx: 'Paciente trae receta externa',
  contact_later: 'Requiere contacto posterior',
  prefer_phone: 'Preferencia de contacto por teléfono',
  prefer_email: 'Preferencia de contacto por correo',
} as const;

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function mapConsultation(record: {
  id: string;
  patientId: string;
  branchId: string;
  status: Consultation['status'];
  openedAt: Date;
  openedBy: string;
  closedAt: Date | null;
  closedBy: string | null;
  abandonmentReason: string | null;
  nonClinicalNoteKey: string | null;
  diagnosis: string | null;
  clinicalNotes: string | null;
  version: number;
}): Consultation {
  return {
    id: record.id,
    patientId: record.patientId,
    branchId: record.branchId,
    status: record.status,
    openedAt: record.openedAt,
    openedBy: record.openedBy,
    closedAt: record.closedAt ?? undefined,
    closedBy: record.closedBy ?? undefined,
    abandonmentReason: record.abandonmentReason ?? undefined,
    nonClinicalNoteKey: record.nonClinicalNoteKey as Consultation['nonClinicalNoteKey'],
    diagnosis: record.diagnosis ?? undefined,
    clinicalNotes: record.clinicalNotes ?? undefined,
    version: record.version,
  };
}

function mapRefraction(record: {
  id: string;
  consultationId: string;
  eye: Eye;
  sphere: Prisma.Decimal | null;
  cylinder: Prisma.Decimal | null;
  axis: number | null;
  addition: Prisma.Decimal | null;
  visualAcuity: string | null;
  visualAcuityDecimal: Prisma.Decimal | null;
  pupillaryDistance: number | null;
  isAmendment: boolean;
  amendedFromId: string | null;
  amendmentReason: string | null;
  createdBy: string;
  createdAt: Date;
}): Refraction {
  return {
    id: record.id,
    consultationId: record.consultationId,
    eye: record.eye,
    sphere: record.sphere === null ? undefined : Number(record.sphere),
    cylinder: record.cylinder === null ? undefined : Number(record.cylinder),
    axis: record.axis ?? undefined,
    addition: record.addition === null ? undefined : Number(record.addition),
    visualAcuity: record.visualAcuity ?? undefined,
    visualAcuityDecimal: record.visualAcuityDecimal === null ? undefined : Number(record.visualAcuityDecimal),
    pupillaryDistance: record.pupillaryDistance ?? undefined,
    isAmendment: record.isAmendment,
    amendedFromId: record.amendedFromId ?? undefined,
    amendmentReason: record.amendmentReason ?? undefined,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
  };
}

function mapPrescription(record: {
  id: string;
  consultationId: string;
  patientId: string;
  branchId: string;
  folio: string;
  issuedAt: Date;
  issuedBy: string;
  usage: Prescription['usage'];
  rightEyeSnapshot: Prisma.JsonValue;
  leftEyeSnapshot: Prisma.JsonValue;
  snapshotSourceIds: Prisma.JsonValue;
  snapshotTakenAt: Date;
  observations: string | null;
  isAmendment: boolean;
  amendedFromId: string | null;
  amendmentReason: string | null;
  version: number;
}): Prescription {
  return {
    id: record.id,
    consultationId: record.consultationId,
    patientId: record.patientId,
    branchId: record.branchId,
    folio: record.folio,
    issuedAt: record.issuedAt,
    issuedBy: record.issuedBy,
    usage: record.usage,
    rightEyeSnapshot: record.rightEyeSnapshot as unknown as Prescription['rightEyeSnapshot'],
    leftEyeSnapshot: record.leftEyeSnapshot as unknown as Prescription['leftEyeSnapshot'],
    snapshotSourceIds: record.snapshotSourceIds as unknown as Prescription['snapshotSourceIds'],
    snapshotTakenAt: record.snapshotTakenAt,
    observations: record.observations ?? undefined,
    isAmendment: record.isAmendment,
    amendedFromId: record.amendedFromId ?? undefined,
    amendmentReason: record.amendmentReason ?? undefined,
    version: record.version,
  };
}

export class PrismaClinicalService {
  private readonly audit = new AuditService();
  private readonly patients = new PrismaPatientRepository();

  private async consultation(id: string) {
    return prisma.consultation.findUnique({ where: { id } });
  }

  private async assertConsent(patientId: string): Promise<void> {
    const notice = await this.patients.getCurrentPrivacyNotice();
    if (!await this.patients.hasValidConsent(patientId, notice.id)) {
      throw new Error('Valid consent is required for clinical data');
    }
  }

  private async resolveBranch(branchId: string) {
    const key = branchId === 'branch-001' ? 'PT' : branchId;
    return prisma.branch.findFirstOrThrow({
      where: isUuid(key) ? { OR: [{ id: key }, { code: key }] } : { code: key },
    });
  }

  async open(input: { patientId: PatientId; branchId: string }, actor: ActorContext): Promise<Consultation> {
    if (!authorize(actor.role, 'open', 'Consultation')) throw new Error('Permission denied');
    const patient = await prisma.patient.findUnique({ where: { id: input.patientId } });
    if (!patient) throw new Error('Patient not found');
    const branch = await this.resolveBranch(input.branchId);
    const record = await prisma.consultation.create({
      data: { patientId: patient.id, branchId: branch.id, openedBy: actor.actorId },
    });
    const consultation = mapConsultation(record);
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'create', entity: 'Consultation', entityId: consultation.id, requestId: actor.requestId });
    return consultation;
  }

  async getFullConsultation(id: ConsultationId, actor: ActorContext): Promise<FullConsultation> {
    if (!authorize(actor.role, 'read', 'FullConsultation')) throw new Error('Permission denied');
    const record = await prisma.consultation.findUnique({
      where: { id },
      include: {
        refractions: { orderBy: { createdAt: 'asc' } },
        prescriptions: { where: { isAmendment: false }, orderBy: { issuedAt: 'desc' }, take: 1 },
      },
    });
    if (!record) throw new Error('Consultation not found');
    const patient = await this.patients.getPatient(record.patientId);
    if (!patient) throw new Error('Patient not found');
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'read', entity: 'FullConsultation', entityId: id, requestId: actor.requestId });
    return {
      consultation: mapConsultation(record),
      patient,
      refractions: record.refractions.map(mapRefraction),
      prescription: record.prescriptions[0] ? mapPrescription(record.prescriptions[0]) : undefined,
    };
  }

  async getSafeSummary(id: ConsultationId, actor: ActorContext): Promise<SafeSummary> {
    if (!authorize(actor.role, 'getSafeSummary', 'SafeSummary')) throw new Error('Permission denied');
    const record = await prisma.consultation.findUnique({
      where: { id },
      include: { patient: true, prescriptions: { where: { isAmendment: false }, orderBy: { issuedAt: 'desc' }, take: 1 } },
    });
    if (!record) throw new Error('Consultation not found');
    const key = record.nonClinicalNoteKey as keyof typeof noteLabels | null;
    const summary = {
      patientName: [record.patient.firstName, record.patient.middleName, record.patient.lastName].filter(Boolean).join(' '),
      folio: record.patient.folio,
      consultationDate: record.openedAt,
      usage: record.prescriptions[0]?.usage,
      status: record.status,
      nonClinicalNoteKey: key ?? undefined,
      nonClinicalNote: key ? noteLabels[key] : undefined,
    };
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'read', entity: 'SafeSummary', entityId: id, requestId: actor.requestId });
    return summary;
  }

  async getSafeSummaryByFolio(folio: Folio, actor: ActorContext): Promise<SafeSummary | null> {
    const patient = await prisma.patient.findUnique({ where: { folio } });
    if (!patient) return null;
    return this.getSafeSummaryByPatientId(patient.id, actor);
  }

  async getSafeSummaryByPatientId(patientId: PatientId, actor: ActorContext): Promise<SafeSummary | null> {
    const consultation = await prisma.consultation.findFirst({ where: { patientId }, orderBy: { openedAt: 'desc' } });
    return consultation ? this.getSafeSummary(consultation.id, actor) : null;
  }

  async listConsultationsByFolio(folio: Folio, actor: ActorContext): Promise<ConsultationSummary[]> {
    const patient = await prisma.patient.findUnique({ where: { folio } });
    if (!patient) return [];
    return this.listConsultationsByPatientId(patient.id, actor);
  }

  async listConsultationsByPatientId(patientId: PatientId, actor: ActorContext): Promise<ConsultationSummary[]> {
    if (!authorize(actor.role, 'listConsultations', 'SafeSummary')) throw new Error('Permission denied');
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return [];
    const records = await prisma.consultation.findMany({
      where: { patientId },
      orderBy: { openedAt: 'desc' },
      include: { prescriptions: { where: { isAmendment: false }, orderBy: { issuedAt: 'desc' }, take: 1 } },
    });
    return records.map((record) => ({
      consultationId: record.id,
      patientId: record.patientId,
      folio: patient.folio,
      openedAt: record.openedAt,
      status: record.status,
      usage: record.prescriptions[0]?.usage,
    }));
  }

  async listReceptionQueue(actor: ActorContext): Promise<ReceptionQueueEntry[]> {
    if (!authorize(actor.role, 'listConsultations', 'SafeSummary')) throw new Error('Permission denied');
    const records = await prisma.consultation.findMany({
      where: {
        status: 'closed',
        prescriptions: {
          some: {
            isAmendment: false,
            saleOrders: { none: { status: { not: 'cancelled' } } },
          },
        },
      },
      include: {
        refractions: { orderBy: { createdAt: 'asc' } },
        prescriptions: {
          where: {
            isAmendment: false,
            saleOrders: { none: { status: { not: 'cancelled' } } },
          },
          orderBy: { issuedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { closedAt: 'desc' },
      take: 50,
    });

    const entries = await Promise.all(records.map(async (record) => {
      const prescription = record.prescriptions[0];
      const patient = await this.patients.getPatient(record.patientId);
      if (!prescription || !patient) return undefined;
      return {
        consultation: mapConsultation(record),
        patient,
        refractions: record.refractions.map(mapRefraction),
        prescription: mapPrescription(prescription),
      } satisfies ReceptionQueueEntry;
    }));

    return entries.filter((entry): entry is ReceptionQueueEntry => entry !== undefined);
  }

  async addRefraction(input: RefractionInput, actor: ActorContext): Promise<Refraction> {
    if (!authorize(actor.role, 'addRefraction', 'Refraction')) throw new Error('Permission denied');
    const consultation = await this.consultation(input.consultationId);
    if (!consultation) throw new Error('Consultation not found');
    if (consultation.status !== 'in_progress') throw new Error('Consultation is not in progress');
    if (consultation.version !== input.expectedVersion) throw new Error('Stale version: expectedVersion does not match');
    await this.assertConsent(consultation.patientId);
    validateRefraction(input);
    const record = await prisma.refraction.create({
      data: {
        consultationId: consultation.id,
        eye: input.eye,
        sphere: input.sphere,
        cylinder: input.cylinder,
        axis: input.axis,
        addition: input.addition,
        visualAcuity: input.visualAcuity,
        visualAcuityDecimal: input.visualAcuityDecimal,
        pupillaryDistance: input.pupillaryDistance,
        createdBy: actor.actorId,
      },
    });
    const refraction = mapRefraction(record);
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'create', entity: 'Refraction', entityId: refraction.id, requestId: actor.requestId, metadata: { eye: refraction.eye } });
    return refraction;
  }

  async amendRefraction(input: RefractionAmendmentInput, actor: ActorContext): Promise<Refraction> {
    if (!authorize(actor.role, 'amendRefraction', 'Refraction')) throw new Error('Permission denied');
    const consultation = await this.consultation(input.consultationId);
    if (!consultation) throw new Error('Consultation not found');
    if (consultation.status !== 'in_progress') throw new Error('Consultation is not in progress');
    if (consultation.version !== input.expectedVersion) throw new Error('Stale version: expectedVersion does not match');
    const original = await prisma.refraction.findUnique({ where: { id: input.amendedFromId } });
    if (!original) throw new Error('Original refraction not found');
    if (original.consultationId !== input.consultationId) throw new Error('Original refraction does not belong to this consultation');
    await this.assertConsent(consultation.patientId);
    validateRefraction(input);
    const record = await prisma.refraction.create({
      data: {
        consultationId: consultation.id,
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
        createdBy: actor.actorId,
      },
    });
    const refraction = mapRefraction(record);
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'amend', entity: 'Refraction', entityId: refraction.id, requestId: actor.requestId, reason: input.amendmentReason });
    return refraction;
  }

  async setNonClinicalNote(input: SetNonClinicalNoteInput, actor: ActorContext): Promise<Consultation> {
    if (!authorize(actor.role, 'setNonClinicalNote', 'Consultation')) throw new Error('Permission denied');
    if (input.noteKey !== null) assertNonClinicalNoteKey(input.noteKey);
    const result = await prisma.consultation.updateMany({
      where: { id: input.consultationId, status: 'in_progress', version: input.expectedVersion },
      data: { nonClinicalNoteKey: input.noteKey, version: { increment: 1 } },
    });
    if (result.count !== 1) throw new Error('Stale version: expectedVersion does not match');
    const record = await prisma.consultation.findUniqueOrThrow({ where: { id: input.consultationId } });
    const consultation = mapConsultation(record);
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'update', entity: 'Consultation', entityId: consultation.id, requestId: actor.requestId, metadata: { noteKey: input.noteKey } });
    return consultation;
  }

  async updateClinicalDetails(
    input: UpdateClinicalDetailsInput,
    actor: ActorContext
  ): Promise<Consultation> {
    if (!authorize(actor.role, 'updateClinicalDetails', 'Consultation')) {
      throw new Error('Permission denied');
    }

    const diagnosis = input.diagnosis?.trim();
    const clinicalNotes = input.clinicalNotes?.trim();
    if (diagnosis && diagnosis.length > 2000) throw new Error('Diagnosis exceeds 2000 characters');
    if (clinicalNotes && clinicalNotes.length > 4000) throw new Error('Clinical notes exceed 4000 characters');

    const result = await prisma.consultation.updateMany({
      where: {
        id: input.consultationId,
        status: 'in_progress',
        version: input.expectedVersion,
      },
      data: {
        ...(input.diagnosis !== undefined && { diagnosis: diagnosis || null }),
        ...(input.clinicalNotes !== undefined && { clinicalNotes: clinicalNotes || null }),
        version: { increment: 1 },
      },
    });
    if (result.count !== 1) throw new Error('Stale version: expectedVersion does not match');

    const record = await prisma.consultation.findUniqueOrThrow({ where: { id: input.consultationId } });
    const consultation = mapConsultation(record);
    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'update',
      entity: 'Consultation',
      entityId: consultation.id,
      requestId: actor.requestId,
      metadata: {
        hasDiagnosis: Boolean(consultation.diagnosis),
        hasClinicalNotes: Boolean(consultation.clinicalNotes),
      },
    });
    return consultation;
  }

  async abandon(input: AbandonConsultationInput, actor: ActorContext): Promise<Consultation> {
    if (!authorize(actor.role, 'abandon', 'Consultation')) throw new Error('Permission denied');
    const current = await this.consultation(input.consultationId);
    if (!current) throw new Error('Consultation not found');
    if (current.openedBy !== actor.actorId) throw new Error('Only the responsible optometrist can abandon this consultation');
    const result = await prisma.consultation.updateMany({ where: { id: input.consultationId, status: 'in_progress', version: input.expectedVersion }, data: { status: 'abandoned', abandonmentReason: input.reason, closedAt: new Date(), closedBy: actor.actorId, version: { increment: 1 } } });
    if (result.count !== 1) throw new Error('Stale version: expectedVersion does not match');
    const record = await prisma.consultation.findUniqueOrThrow({ where: { id: input.consultationId } });
    const consultation = mapConsultation(record);
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'update', entity: 'Consultation', entityId: consultation.id, requestId: actor.requestId, reason: input.reason });
    return consultation;
  }

  async releaseConsultation(input: ReleaseConsultationInput, actor: ActorContext): Promise<Consultation> {
    if (!authorize(actor.role, 'releaseConsultation', 'Consultation')) throw new Error('Permission denied');
    const result = await prisma.consultation.updateMany({ where: { id: input.consultationId, status: 'in_progress', version: input.expectedVersion }, data: { version: { increment: 1 } } });
    if (result.count !== 1) throw new Error('Stale version: expectedVersion does not match');
    const record = await prisma.consultation.findUniqueOrThrow({ where: { id: input.consultationId } });
    const consultation = mapConsultation(record);
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'update', entity: 'Consultation', entityId: consultation.id, requestId: actor.requestId, reason: input.reason, metadata: { releasedByAdmin: true } });
    return consultation;
  }

  async issuePrescription(input: IssuePrescriptionInput, actor: ActorContext): Promise<Prescription> {
    if (!authorize(actor.role, 'issuePrescription', 'Prescription')) throw new Error('Permission denied');
    const prescription = await prisma.$transaction(async (transaction) => {
      const consultation = await transaction.consultation.findUnique({ where: { id: input.consultationId } });
      if (!consultation) throw new Error('Consultation not found');
      if (consultation.status !== 'in_progress') throw new Error('Consultation is not in progress');
      if (consultation.version !== input.expectedVersion) throw new Error('Stale version: expectedVersion does not match');
      await this.assertConsent(consultation.patientId);
      const refs = await transaction.refraction.findMany({ where: { consultationId: consultation.id }, orderBy: { createdAt: 'desc' } });
      const latest = new Map<Eye, Refraction>();
      for (const ref of refs) if (!latest.has(ref.eye)) latest.set(ref.eye, mapRefraction(ref));
      const right = latest.get('OD');
      const left = latest.get('OI');
      if (!right || !left) throw new Error('Valid refraction for both eyes is required');
      const branch = await transaction.branch.update({ where: { id: consultation.branchId }, data: { nextPrescriptionSequence: { increment: 1 } } });
      const now = new Date();
      const record = await transaction.prescription.create({
        data: {
          consultationId: consultation.id,
          patientId: consultation.patientId,
          branchId: consultation.branchId,
          folio: generateFolio('RX', branch.nextPrescriptionSequence - 1),
          issuedBy: actor.actorId,
          usage: input.usage,
          rightEyeSnapshot: toJson(right),
          leftEyeSnapshot: toJson(left),
          snapshotSourceIds: toJson([right.id, left.id]),
          snapshotTakenAt: now,
          observations: input.observations,
        },
      });
      await transaction.consultation.update({ where: { id: consultation.id }, data: { status: 'closed', closedAt: now, closedBy: actor.actorId, version: { increment: 1 } } });
      return mapPrescription(record);
    });
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'create', entity: 'Prescription', entityId: prescription.id, requestId: actor.requestId, metadata: { consultationId: input.consultationId } });
    return prescription;
  }

  async amendPrescription(input: PrescriptionAmendmentInput, actor: ActorContext): Promise<Prescription> {
    if (!authorize(actor.role, 'amendPrescription', 'Prescription')) throw new Error('Permission denied');
    const original = await prisma.prescription.findUnique({ where: { id: input.prescriptionId } });
    if (!original) throw new Error('Original prescription not found');
    if (original.isAmendment) throw new Error('Cannot amend an amendment; amend the base prescription');
    if (original.version !== input.expectedVersion) throw new Error('Stale version: expectedVersion does not match');
    await this.assertConsent(original.patientId);
    const branch = await prisma.branch.update({ where: { id: original.branchId }, data: { nextPrescriptionSequence: { increment: 1 } } });
    const record = await prisma.prescription.create({ data: { consultationId: original.consultationId, patientId: original.patientId, branchId: original.branchId, folio: generateFolio('RX', branch.nextPrescriptionSequence - 1), issuedBy: actor.actorId, usage: input.usage, rightEyeSnapshot: toJson(original.rightEyeSnapshot), leftEyeSnapshot: toJson(original.leftEyeSnapshot), snapshotSourceIds: toJson(original.snapshotSourceIds), snapshotTakenAt: original.snapshotTakenAt, observations: input.observations, isAmendment: true, amendedFromId: original.id, amendmentReason: input.amendmentReason, version: original.version + 1 } });
    const prescription = mapPrescription(record);
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'amend', entity: 'Prescription', entityId: prescription.id, requestId: actor.requestId, reason: input.amendmentReason });
    return prescription;
  }
}

export const prismaClinicalService = new PrismaClinicalService();
