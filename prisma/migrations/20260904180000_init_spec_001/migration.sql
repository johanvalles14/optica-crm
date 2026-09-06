-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('male', 'female', 'other', 'not_specified');

-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('active', 'inactive_for_contact');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('in_progress', 'closed', 'abandoned');

-- CreateEnum
CREATE TYPE "Eye" AS ENUM ('OD', 'OI');

-- CreateEnum
CREATE TYPE "LensUsage" AS ENUM ('lejos', 'cerca', 'bifocal', 'progresivo', 'contacto');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('create', 'read', 'update', 'amend', 'delete_attempt', 'ACCESS_DENIED', 'LOGIN', 'LOGOUT', 'SESSION_INVALIDATED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "displayName" VARCHAR(160) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "role" VARCHAR(64) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "code" VARCHAR(8) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "nextPatientSequence" INTEGER NOT NULL DEFAULT 1,
    "nextPrescriptionSequence" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL,
    "folio" VARCHAR(8) NOT NULL,
    "branchId" UUID NOT NULL,
    "firstName" VARCHAR(120) NOT NULL,
    "lastName" VARCHAR(120) NOT NULL,
    "middleName" VARCHAR(120),
    "birthDate" DATE NOT NULL,
    "sex" "Sex" NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "email" VARCHAR(320),
    "address" VARCHAR(500),
    "allergies" TEXT,
    "conditions" TEXT,
    "emergencyContact" JSONB,
    "isContactAllowed" BOOLEAN NOT NULL DEFAULT true,
    "status" "PatientStatus" NOT NULL DEFAULT 'active',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" UUID NOT NULL,
    "updatedBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_notices" (
    "id" UUID NOT NULL,
    "version" VARCHAR(32) NOT NULL,
    "contentHash" VARCHAR(128) NOT NULL,
    "effectiveDate" TIMESTAMPTZ(3) NOT NULL,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "privacy_notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "noticeId" UUID NOT NULL,
    "grantedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" UUID NOT NULL,
    "source" VARCHAR(255) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'in_progress',
    "openedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedBy" UUID NOT NULL,
    "closedAt" TIMESTAMPTZ(3),
    "closedBy" UUID,
    "abandonmentReason" TEXT,
    "nonClinicalNoteKey" VARCHAR(64),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refractions" (
    "id" UUID NOT NULL,
    "consultationId" UUID NOT NULL,
    "eye" "Eye" NOT NULL,
    "sphere" DECIMAL(5,2),
    "cylinder" DECIMAL(5,2),
    "axis" INTEGER,
    "addition" DECIMAL(5,2),
    "visualAcuity" VARCHAR(32),
    "visualAcuityDecimal" DECIMAL(4,2),
    "pupillaryDistance" INTEGER,
    "isAmendment" BOOLEAN NOT NULL DEFAULT false,
    "amendedFromId" UUID,
    "amendmentReason" TEXT,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" UUID NOT NULL,
    "consultationId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "folio" VARCHAR(16) NOT NULL,
    "issuedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedBy" UUID NOT NULL,
    "usage" "LensUsage" NOT NULL,
    "rightEyeSnapshot" JSONB NOT NULL,
    "leftEyeSnapshot" JSONB NOT NULL,
    "snapshotSourceIds" JSONB NOT NULL,
    "snapshotTakenAt" TIMESTAMPTZ(3) NOT NULL,
    "observations" TEXT,
    "isAmendment" BOOLEAN NOT NULL DEFAULT false,
    "amendedFromId" UUID,
    "amendmentReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_clinical_notes" (
    "id" UUID NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "non_clinical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" VARCHAR(80) NOT NULL,
    "entityId" VARCHAR(80) NOT NULL,
    "requestId" VARCHAR(128) NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "patients_folio_key" ON "patients"("folio");

-- CreateIndex
CREATE INDEX "patients_lastName_firstName_idx" ON "patients"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "patients_phone_idx" ON "patients"("phone");

-- CreateIndex
CREATE INDEX "patients_branchId_idx" ON "patients"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "privacy_notices_version_key" ON "privacy_notices"("version");

-- CreateIndex
CREATE INDEX "privacy_notices_effectiveDate_idx" ON "privacy_notices"("effectiveDate");

-- CreateIndex
CREATE INDEX "consents_patientId_grantedAt_idx" ON "consents"("patientId", "grantedAt");

-- CreateIndex
CREATE INDEX "consents_noticeId_idx" ON "consents"("noticeId");

-- CreateIndex
CREATE INDEX "consultations_patientId_status_idx" ON "consultations"("patientId", "status");

-- CreateIndex
CREATE INDEX "consultations_branchId_openedAt_idx" ON "consultations"("branchId", "openedAt");

-- CreateIndex
CREATE INDEX "refractions_consultationId_eye_createdAt_idx" ON "refractions"("consultationId", "eye", "createdAt");

-- CreateIndex
CREATE INDEX "refractions_amendedFromId_idx" ON "refractions"("amendedFromId");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_folio_key" ON "prescriptions"("folio");

-- CreateIndex
CREATE INDEX "prescriptions_consultationId_isAmendment_idx" ON "prescriptions"("consultationId", "isAmendment");

-- CreateIndex
CREATE INDEX "prescriptions_patientId_issuedAt_idx" ON "prescriptions"("patientId", "issuedAt");

-- CreateIndex
CREATE INDEX "prescriptions_amendedFromId_idx" ON "prescriptions"("amendedFromId");

-- CreateIndex
CREATE UNIQUE INDEX "non_clinical_notes_key_key" ON "non_clinical_notes"("key");

-- CreateIndex
CREATE INDEX "non_clinical_notes_active_displayOrder_idx" ON "non_clinical_notes"("active", "displayOrder");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_occurredAt_idx" ON "audit_logs"("entity", "entityId", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_logs_requestId_idx" ON "audit_logs"("requestId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_occurredAt_idx" ON "audit_logs"("actorId", "occurredAt");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privacy_notices" ADD CONSTRAINT "privacy_notices_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "privacy_notices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_openedBy_fkey" FOREIGN KEY ("openedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_nonClinicalNoteKey_fkey" FOREIGN KEY ("nonClinicalNoteKey") REFERENCES "non_clinical_notes"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refractions" ADD CONSTRAINT "refractions_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refractions" ADD CONSTRAINT "refractions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refractions" ADD CONSTRAINT "refractions_amendedFromId_fkey" FOREIGN KEY ("amendedFromId") REFERENCES "refractions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_amendedFromId_fkey" FOREIGN KEY ("amendedFromId") REFERENCES "prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

