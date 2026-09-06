-- Constraints que Prisma no expresa como parte del schema declarativo.
-- Mantienen invariantes de concurrencia y prescripción base.
CREATE UNIQUE INDEX "consultations_one_in_progress_per_patient"
  ON "consultations" ("patientId")
  WHERE "status" = 'in_progress';

CREATE UNIQUE INDEX "prescriptions_one_base_per_consultation"
  ON "prescriptions" ("consultationId")
  WHERE "isAmendment" = false;

CREATE UNIQUE INDEX "consents_one_active_per_patient"
  ON "consents" ("patientId")
  WHERE "revokedAt" IS NULL;

-- Validaciones invariantes del dominio. Los rangos completos permanecen en
-- Zod para producir errores de captura claros antes de persistir.
ALTER TABLE "refractions"
  ADD CONSTRAINT "refractions_cylinder_negative"
  CHECK ("cylinder" IS NULL OR ("cylinder" >= -10.00 AND "cylinder" <= 0.00));

ALTER TABLE "refractions"
  ADD CONSTRAINT "refractions_axis_range"
  CHECK ("axis" IS NULL OR ("axis" >= 0 AND "axis" <= 180));

ALTER TABLE "refractions"
  ADD CONSTRAINT "refractions_pupillary_distance_range"
  CHECK ("pupillaryDistance" IS NULL OR ("pupillaryDistance" >= 30 AND "pupillaryDistance" <= 80));
