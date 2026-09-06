ALTER TABLE "branches"
  ADD COLUMN "nextLabSequence" INTEGER NOT NULL DEFAULT 1;

CREATE TYPE "LabDestination" AS ENUM ('internal_workshop', 'external_lab');
CREATE TYPE "LabOrderStatus" AS ENUM ('queued', 'in_process', 'quality_control', 'completed', 'rework_needed', 'cancelled');
CREATE TYPE "FrameMountingType" AS ENUM ('full_rim', 'semi_rimless_groove', 'rimless_drill');

CREATE TABLE "lab_orders" (
  "id" UUID NOT NULL,
  "folio" VARCHAR(16) NOT NULL,
  "saleOrderId" UUID NOT NULL,
  "saleOrderFolio" VARCHAR(16) NOT NULL,
  "branchId" UUID NOT NULL,
  "patientName" VARCHAR(160) NOT NULL,
  "destination" "LabDestination" NOT NULL DEFAULT 'internal_workshop',
  "externalLabName" VARCHAR(100),
  "externalGuideNumber" VARCHAR(64),
  "expectedReturnDate" DATE,
  "status" "LabOrderStatus" NOT NULL DEFAULT 'queued',
  "frameCode" VARCHAR(32) NOT NULL,
  "frameDescription" VARCHAR(255),
  "frameMountingType" "FrameMountingType" NOT NULL DEFAULT 'full_rim',
  "lensMaterial" VARCHAR(80) NOT NULL,
  "treatments" JSONB NOT NULL,
  "rightEye" JSONB NOT NULL,
  "leftEye" JSONB NOT NULL,
  "observations" VARCHAR(500),
  "assignedTechnicianId" UUID,
  "qualityApprovedAt" TIMESTAMPTZ(3),
  "qualityApprovedBy" UUID,
  "reworkReason" VARCHAR(500),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lab_orders_folio_key" ON "lab_orders"("folio");
CREATE INDEX "lab_orders_branchId_status_idx" ON "lab_orders"("branchId", "status");
CREATE INDEX "lab_orders_saleOrderId_idx" ON "lab_orders"("saleOrderId");
CREATE INDEX "lab_orders_folio_idx" ON "lab_orders"("folio");

ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "sale_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_assignedTechnicianId_fkey" FOREIGN KEY ("assignedTechnicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_qualityApprovedBy_fkey" FOREIGN KEY ("qualityApprovedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
