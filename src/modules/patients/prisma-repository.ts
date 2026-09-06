import type { Prisma } from '@prisma/client';
import type { UserId } from '../../../contracts/auth.contract';
import type {
  Consent,
  ConsentInput,
  Folio,
  Patient,
  PatientId,
  PatientInput,
  PatientSearchQuery,
  PatientSearchResult,
  PrivacyNotice,
} from '../../../contracts/patients.contract';
import { prisma } from '../../lib/prisma';
import { generateFolio } from './folio-generator';

type StoredPatient = Prisma.PatientGetPayload<{
  include: { consultations: { orderBy: { openedAt: 'desc' }; take: 1 } };
}>;

function mapPatient(record: StoredPatient): Patient {
  return {
    id: record.id,
    folio: record.folio,
    branchId: record.branchId,
    firstName: record.firstName,
    lastName: record.lastName,
    middleName: record.middleName ?? undefined,
    birthDate: record.birthDate,
    sex: record.sex,
    phone: record.phone,
    email: record.email ?? undefined,
    address: record.address ?? undefined,
    allergies: record.allergies ?? undefined,
    conditions: record.conditions ?? undefined,
    emergencyContact: (record.emergencyContact as unknown as Patient['emergencyContact']) ?? undefined,
    isContactAllowed: record.isContactAllowed,
    status: record.status,
    version: record.version,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function searchResult(record: StoredPatient): PatientSearchResult {
  const consultation = record.consultations[0];
  return {
    folio: record.folio,
    fullName: [record.firstName, record.middleName, record.lastName].filter(Boolean).join(' '),
    birthDate: record.birthDate,
    maskedPhone: `***${record.phone.slice(-4)}`,
    lastConsultationStatus: consultation?.status ?? 'none',
  };
}

export class PrismaPatientRepository {
  private readonly patientInclude = {
    consultations: { orderBy: { openedAt: 'desc' as const }, take: 1 },
  };

  async createPatient(input: PatientInput, createdBy: UserId): Promise<Patient> {
    return prisma.$transaction(async (transaction) => {
      const branchKey = input.branchId === 'branch-001' ? 'PT' : input.branchId;
      const branchWhere = /^[0-9a-f-]{36}$/i.test(branchKey)
        ? { OR: [{ id: branchKey }, { code: branchKey }] }
        : { code: branchKey };
      const branchRecord = await transaction.branch.findFirstOrThrow({ where: branchWhere });
      const branch = await transaction.branch.update({
        where: { id: branchRecord.id },
        data: { nextPatientSequence: { increment: 1 } },
      });
      const folio = generateFolio(branch.code, branch.nextPatientSequence - 1);
      const record = await transaction.patient.create({
        data: {
          folio,
          branchId: branch.id,
          firstName: input.firstName,
          lastName: input.lastName,
          middleName: input.middleName,
          birthDate: input.birthDate,
          sex: input.sex,
          phone: input.phone,
          email: input.email,
          address: input.address,
          allergies: input.allergies,
          conditions: input.conditions,
          ...(input.emergencyContact && { emergencyContact: input.emergencyContact as unknown as Prisma.InputJsonValue }),
          createdBy,
          updatedBy: createdBy,
        },
        include: this.patientInclude,
      });
      return mapPatient(record);
    });
  }

  async updatePatient(
    patientId: PatientId,
    input: Partial<PatientInput>,
    expectedVersion: number,
    updatedBy: UserId
  ): Promise<Patient> {
    const record = await prisma.patient.updateMany({
      where: { id: patientId, version: expectedVersion },
      data: {
        ...(input.firstName !== undefined && { firstName: input.firstName }),
        ...(input.lastName !== undefined && { lastName: input.lastName }),
        ...(input.middleName !== undefined && { middleName: input.middleName }),
        ...(input.birthDate !== undefined && { birthDate: input.birthDate }),
        ...(input.sex !== undefined && { sex: input.sex }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.allergies !== undefined && { allergies: input.allergies }),
        ...(input.conditions !== undefined && { conditions: input.conditions }),
        ...(input.emergencyContact !== undefined && { emergencyContact: input.emergencyContact as unknown as Prisma.InputJsonValue }),
        updatedBy,
        version: { increment: 1 },
      },
    });
    if (record.count !== 1) throw new Error('Stale version: expectedVersion does not match');
    const updated = await prisma.patient.findUniqueOrThrow({ where: { id: patientId }, include: this.patientInclude });
    return mapPatient(updated);
  }

  async searchPatients(query: PatientSearchQuery): Promise<PatientSearchResult[]> {
    const phone = query.phone?.replace(/\D/g, '');
    if (phone && phone.length < 4) throw new Error('Phone search requires at least 4 digits');
    const records = await prisma.patient.findMany({
      where: {
        ...(query.folio && { folio: query.folio }),
        ...(query.name && {
          OR: [
            { firstName: { contains: query.name, mode: 'insensitive' } },
            { lastName: { contains: query.name, mode: 'insensitive' } },
          ],
        }),
        ...(phone && { phone: { contains: phone } }),
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: query.limit,
      include: this.patientInclude,
    });
    return records.map(searchResult);
  }

  async getPatient(patientId: PatientId): Promise<Patient | undefined> {
    const record = await prisma.patient.findUnique({ where: { id: patientId }, include: this.patientInclude });
    return record ? mapPatient(record) : undefined;
  }

  async getPatientByFolio(folio: Folio): Promise<Patient | undefined> {
    const record = await prisma.patient.findUnique({ where: { folio }, include: this.patientInclude });
    return record ? mapPatient(record) : undefined;
  }

  async recordConsent(input: ConsentInput, grantedBy: UserId): Promise<Consent> {
    const record = await prisma.consent.create({
      data: { patientId: input.patientId, noticeId: input.noticeId, source: input.source, grantedBy },
    });
    return {
      id: record.id,
      patientId: record.patientId,
      noticeId: record.noticeId,
      grantedAt: record.grantedAt,
      grantedBy: record.grantedBy,
      source: record.source,
      revokedAt: record.revokedAt ?? undefined,
    };
  }

  async getCurrentPrivacyNotice(): Promise<PrivacyNotice> {
    const record = await prisma.privacyNotice.findFirstOrThrow({ orderBy: { effectiveDate: 'desc' } });
    return record;
  }

  async hasValidConsent(patientId: PatientId, noticeId: string): Promise<boolean> {
    const consent = await prisma.consent.findFirst({
      where: { patientId, noticeId, revokedAt: null },
      select: { id: true },
    });
    return consent !== null;
  }
}
