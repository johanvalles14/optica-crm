ALTER TABLE "consultations"
  ADD COLUMN "diagnosis" TEXT,
  ADD COLUMN "clinicalNotes" TEXT;

CREATE UNIQUE INDEX "sale_orders_active_prescription_key"
  ON "sale_orders" ("prescriptionId")
  WHERE "prescriptionId" IS NOT NULL AND "status" <> 'cancelled';
