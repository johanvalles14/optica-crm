import { randomUUID } from 'node:crypto';
import type {
  BranchId,
  Consent,
  ConsentInput,
  Folio,
  Patient,
  PatientId,
  PatientInput,
  PatientSearchQuery,
  PatientSearchResult,
  PatientStatus,
  PrivacyNotice,
  PrivacyNoticeId,
} from '../../../contracts/patients.contract';
import type { UserId } from '../../../contracts/auth.contract';
import { generateFolio } from './folio-generator';

interface Branch {
  id: BranchId;
  code: string;
  name: string;
  nextPatientSequence: number;
  nextPrescriptionSequence: number;
}

function maskPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.length < 4) return trimmed;
  return `***${trimmed.slice(-4)}`;
}

function buildFullName(p: Patient): string {
  return [p.firstName, p.middleName, p.lastName]
    .filter((part) => Boolean(part))
    .join(' ');
}

class PatientRepository {
  private branches = new Map<BranchId, Branch>();
  private patients = new Map<PatientId, Patient>();
  private consents = new Map<string, Consent>();
  private privacyNotices = new Map<PrivacyNoticeId, PrivacyNotice>();
  private folioToPatientId = new Map<Folio, PatientId>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    this.branches.set('branch-001', {
      id: 'branch-001',
      code: 'PT',
      name: 'Sucursal Principal',
      nextPatientSequence: 100,
      nextPrescriptionSequence: 100,
    });
    this.branches.set('branch-002', {
      id: 'branch-002',
      code: 'RX',
      name: 'Sucursal Prescripciones',
      nextPatientSequence: 1,
      nextPrescriptionSequence: 100,
    });

    this.privacyNotices.set('notice-v1-2026', {
      id: 'notice-v1-2026',
      version: '1.0.0',
      contentHash: 'sha256:a1b2c3d4e5f6...',
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
    });
    this.privacyNotices.set('notice-v2-2026', {
      id: 'notice-v2-2026',
      version: '1.1.0',
      contentHash: 'sha256:f6e5d4c3b2a1...',
      effectiveDate: new Date('2026-06-01T00:00:00.000Z'),
    });

    const seedPatients: Array<[PatientId, Partial<Patient>]> = [
      [
        'patient-001',
        {
          folio: 'PT000001',
          branchId: 'branch-001',
          firstName: 'Juan',
          lastName: 'Pérez',
          middleName: 'García',
          birthDate: new Date('1990-05-15T00:00:00.000Z'),
          sex: 'male',
          phone: '8711234567',
          email: 'juan.perez@example.test',
          address: 'Calle Ficticia 123, Colonia Centro',
          allergies: 'Ninguna conocida',
          conditions: 'Ninguna conocida',
          emergencyContact: { name: 'Ana Pérez', phone: '8717654321' },
        },
      ],
      [
        'patient-002',
        {
          folio: 'PT000002',
          branchId: 'branch-001',
          firstName: 'María',
          lastName: 'López',
          birthDate: new Date('1985-08-22T00:00:00.000Z'),
          sex: 'female',
          phone: '8719876543',
        },
      ],
      [
        'patient-with-current-consent',
        {
          folio: 'PT000003',
          branchId: 'branch-001',
          firstName: 'Carlos',
          lastName: 'Vigente',
          birthDate: new Date('1980-01-01T00:00:00.000Z'),
          sex: 'male',
          phone: '8710000001',
        },
      ],
      [
        'patient-with-old-consent',
        {
          folio: 'PT000004',
          branchId: 'branch-001',
          firstName: 'Laura',
          lastName: 'Antiguo',
          birthDate: new Date('1975-01-01T00:00:00.000Z'),
          sex: 'female',
          phone: '8710000002',
        },
      ],
      [
        'patient-no-consent',
        {
          folio: 'PT000005',
          branchId: 'branch-001',
          firstName: 'Roberto',
          lastName: 'Sinconsentimiento',
          birthDate: new Date('1995-01-01T00:00:00.000Z'),
          sex: 'male',
          phone: '8710000003',
        },
      ],
      [
        'patient-006',
        {
          folio: 'PT000006',
          branchId: 'branch-001',
          firstName: 'Ana',
          lastName: 'Hernández',
          birthDate: new Date('1992-03-10T00:00:00.000Z'),
          sex: 'female',
          phone: '8711111111',
        },
      ],
      [
        'patient-007',
        {
          folio: 'PT000007',
          branchId: 'branch-001',
          firstName: 'Luis',
          lastName: 'García',
          birthDate: new Date('1988-07-20T00:00:00.000Z'),
          sex: 'male',
          phone: '8712222222',
        },
      ],
      [
        'patient-008',
        {
          folio: 'PT000008',
          branchId: 'branch-001',
          firstName: 'Carmen',
          lastName: 'Martínez',
          birthDate: new Date('1996-11-05T00:00:00.000Z'),
          sex: 'female',
          phone: '8713333333',
        },
      ],
      [
        'patient-009',
        {
          folio: 'PT000009',
          branchId: 'branch-001',
          firstName: 'Jorge',
          lastName: 'López',
          birthDate: new Date('1982-04-15T00:00:00.000Z'),
          sex: 'male',
          phone: '8714444444',
        },
      ],
      [
        'patient-010',
        {
          folio: 'PT000010',
          branchId: 'branch-001',
          firstName: 'Diana',
          lastName: 'González',
          birthDate: new Date('1991-09-25T00:00:00.000Z'),
          sex: 'female',
          phone: '8715555555',
        },
      ],
      [
        'patient-011',
        {
          folio: 'PT000011',
          branchId: 'branch-001',
          firstName: 'Pedro',
          lastName: 'Pérez',
          birthDate: new Date('1987-02-14T00:00:00.000Z'),
          sex: 'male',
          phone: '8716666666',
        },
      ],
      [
        'patient-012',
        {
          folio: 'PT000012',
          branchId: 'branch-001',
          firstName: 'Sofía',
          lastName: 'Rodríguez',
          birthDate: new Date('1993-06-30T00:00:00.000Z'),
          sex: 'female',
          phone: '8717777777',
        },
      ],
      [
        'patient-013',
        {
          folio: 'PT000013',
          branchId: 'branch-001',
          firstName: 'Miguel',
          lastName: 'Sánchez',
          birthDate: new Date('1984-12-12T00:00:00.000Z'),
          sex: 'male',
          phone: '8718888888',
        },
      ],
      [
        'patient-014',
        {
          folio: 'PT000014',
          branchId: 'branch-001',
          firstName: 'Elena',
          lastName: 'Torres',
          birthDate: new Date('1989-05-05T00:00:00.000Z'),
          sex: 'female',
          phone: '8719999999',
        },
      ],
      [
        'patient-015',
        {
          folio: 'PT000015',
          branchId: 'branch-001',
          firstName: 'Ricardo',
          lastName: 'Mendoza',
          birthDate: new Date('1983-08-18T00:00:00.000Z'),
          sex: 'male',
          phone: '8711010101',
        },
      ],
      [
        'patient-016',
        {
          folio: 'PT000016',
          branchId: 'branch-001',
          firstName: 'Patricia',
          lastName: 'Ruiz',
          birthDate: new Date('1990-02-28T00:00:00.000Z'),
          sex: 'female',
          phone: '8712020202',
        },
      ],
      [
        'patient-017',
        {
          folio: 'PT000017',
          branchId: 'branch-001',
          firstName: 'Fernando',
          lastName: 'Castro',
          birthDate: new Date('1978-11-11T00:00:00.000Z'),
          sex: 'male',
          phone: '8713030303',
        },
      ],
      [
        'patient-018',
        {
          folio: 'PT000018',
          branchId: 'branch-001',
          firstName: 'Lucía',
          lastName: 'Vargas',
          birthDate: new Date('1994-04-04T00:00:00.000Z'),
          sex: 'female',
          phone: '8714040404',
        },
      ],
      [
        'patient-019',
        {
          folio: 'PT000019',
          branchId: 'branch-001',
          firstName: 'Andrés',
          lastName: 'Domínguez',
          birthDate: new Date('1986-06-06T00:00:00.000Z'),
          sex: 'male',
          phone: '8715050505',
        },
      ],
    ];

    for (const [id, partial] of seedPatients) {
      const patient: Patient = {
        id,
        folio: partial.folio as Folio,
        branchId: partial.branchId as BranchId,
        firstName: partial.firstName ?? 'Nombre',
        lastName: partial.lastName ?? 'Apellido',
        middleName: partial.middleName,
        birthDate: partial.birthDate ?? new Date(),
        sex: partial.sex ?? 'not_specified',
        phone: partial.phone ?? '0000000000',
        email: partial.email,
        address: partial.address,
        allergies: partial.allergies,
        conditions: partial.conditions,
        emergencyContact: partial.emergencyContact,
        isContactAllowed: true,
        status: 'active' as PatientStatus,
        version: 1,
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        updatedAt: new Date('2026-09-01T00:00:00.000Z'),
      };
      this.patients.set(id, patient);
      this.folioToPatientId.set(patient.folio, id);
    }

    const consentPatientsV2: PatientId[] = [
      'patient-001',
      'patient-002',
      'patient-006',
      'patient-007',
      'patient-008',
      'patient-009',
      'patient-010',
      'patient-011',
      'patient-012',
      'patient-013',
      'patient-014',
      'patient-015',
      'patient-016',
      'patient-017',
      'patient-018',
      'patient-019',
    ];
    for (const patientId of consentPatientsV2) {
      this.addConsent({
        id: `consent-${patientId}`,
        patientId,
        noticeId: 'notice-v2-2026',
        grantedAt: new Date('2026-09-01T00:00:00.000Z'),
        grantedBy: 'user-opt-001',
        source: 'seed',
      });
    }

    const consentPatientsV1: PatientId[] = [
      'patient-with-current-consent',
      'patient-with-old-consent',
    ];
    for (const patientId of consentPatientsV1) {
      this.addConsent({
        id: `consent-${patientId}`,
        patientId,
        noticeId: 'notice-v1-2026',
        grantedAt: new Date('2026-09-01T00:00:00.000Z'),
        grantedBy: 'user-opt-001',
        source: 'seed',
      });
    }
  }

  private addConsent(consent: Consent): void {
    this.consents.set(consent.id, consent);
  }

  getCurrentPrivacyNotice(): PrivacyNotice {
    const notice = this.privacyNotices.get('notice-v2-2026');
    if (!notice) throw new Error('No active privacy notice found');
    return notice;
  }

  getPrivacyNotice(id: PrivacyNoticeId): PrivacyNotice | undefined {
    return this.privacyNotices.get(id);
  }

  findBranch(branchId: BranchId): Branch | undefined {
    return this.branches.get(branchId);
  }

  getPatient(patientId: PatientId): Patient | undefined {
    return this.patients.get(patientId);
  }

  getPatientByFolio(folio: Folio): Patient | undefined {
    const id = this.folioToPatientId.get(folio);
    if (!id) return undefined;
    return this.patients.get(id);
  }

  createPatient(input: PatientInput, createdBy: UserId): Patient {
    const branch = this.branches.get(input.branchId);
    if (!branch) {
      throw new Error(`Branch ${input.branchId} not found`);
    }
    const sequence = branch.nextPatientSequence;
    branch.nextPatientSequence += 1;

    const folio = generateFolio(branch.code, sequence);
    if (this.folioToPatientId.has(folio)) {
      throw new Error(`Folio collision detected: ${folio}`);
    }

    const now = new Date();
    const patient: Patient = {
      id: randomUUID(),
      folio,
      branchId: input.branchId,
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
      emergencyContact: input.emergencyContact,
      isContactAllowed: true,
      status: 'active',
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.patients.set(patient.id, patient);
    this.folioToPatientId.set(patient.folio, patient.id);
    return patient;
  }

  updatePatient(
    patientId: PatientId,
    input: Partial<PatientInput>,
    expectedVersion: number
  ): Patient {
    const patient = this.patients.get(patientId);
    if (!patient) throw new Error('Patient not found');
    if (patient.version !== expectedVersion) {
      throw new Error('Stale version: expectedVersion does not match');
    }

    const updated: Patient = {
      ...patient,
      ...(input.branchId !== undefined && { branchId: input.branchId }),
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
      ...(input.emergencyContact !== undefined && {
        emergencyContact: input.emergencyContact,
      }),
      version: patient.version + 1,
      updatedAt: new Date(),
    };

    // folio branch changes are not supported in this stub.
    this.patients.set(patientId, updated);
    return updated;
  }

  searchPatients(
    query: PatientSearchQuery,
    getLastConsultationStatus: (patientId: PatientId) => string
  ): PatientSearchResult[] {
    const results: PatientSearchResult[] = [];
    const normalizedName = query.name?.toLowerCase().trim();
    const normalizedPhone = query.phone?.replace(/\D/g, '');

    if (normalizedPhone && normalizedPhone.length < 4) {
      throw new Error('Phone search requires at least 4 digits');
    }

    for (const patient of this.patients.values()) {
      if (query.folio && patient.folio !== query.folio) continue;
      if (normalizedName) {
        const fullName = buildFullName(patient).toLowerCase();
        if (!fullName.includes(normalizedName)) continue;
      }
      if (normalizedPhone) {
        const patientPhone = patient.phone.replace(/\D/g, '');
        if (!patientPhone.includes(normalizedPhone)) continue;
      }

      results.push({
        folio: patient.folio,
        fullName: buildFullName(patient),
        birthDate: patient.birthDate,
        maskedPhone: maskPhone(patient.phone),
        lastConsultationStatus: getLastConsultationStatus(
          patient.id
        ) as PatientSearchResult['lastConsultationStatus'],
      });
    }

    return results.slice(0, query.limit);
  }

  recordConsent(input: ConsentInput, grantedBy: UserId): Consent {
    const patient = this.patients.get(input.patientId);
    if (!patient) throw new Error('Patient not found');
    const notice = this.privacyNotices.get(input.noticeId);
    if (!notice) throw new Error('Privacy notice not found');

    const consent: Consent = {
      id: randomUUID(),
      patientId: input.patientId,
      noticeId: input.noticeId,
      grantedAt: new Date(),
      grantedBy,
      source: input.source,
    };
    this.consents.set(consent.id, consent);
    return consent;
  }

  getValidConsent(patientId: PatientId): Consent | undefined {
    let latest: Consent | undefined;
    for (const consent of this.consents.values()) {
      if (consent.patientId !== patientId) continue;
      if (consent.revokedAt) continue;
      if (!latest || consent.grantedAt > latest.grantedAt) {
        latest = consent;
      }
    }
    return latest;
  }

  listPatients(): Patient[] {
    return Array.from(this.patients.values());
  }

  reservePrescriptionSequence(branchId: BranchId): number {
    const branch = this.branches.get(branchId);
    if (!branch) throw new Error(`Branch ${branchId} not found`);
    const sequence = branch.nextPrescriptionSequence;
    branch.nextPrescriptionSequence += 1;
    return sequence;
  }
}

export const patientRepository = new PatientRepository();
