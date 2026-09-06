CREATE TYPE "ShiftStatus" AS ENUM ('open', 'closed');

CREATE TABLE "cash_shifts" (
  "id" UUID NOT NULL,
  "branchId" UUID NOT NULL,
  "cashierId" UUID NOT NULL,
  "status" "ShiftStatus" NOT NULL DEFAULT 'open',
  "openedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMPTZ(3),
  "initialFloat" DECIMAL(10,2) NOT NULL,
  "expensesTotal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "expectedCash" DECIMAL(10,2),
  "declaredCash" DECIMAL(10,2),
  "cashDifference" DECIMAL(10,2),
  "cardTotal" DECIMAL(10,2),
  "transferTotal" DECIMAL(10,2),
  "totalCollected" DECIMAL(10,2),
  "notes" VARCHAR(500),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "cash_shifts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cash_expenses" (
  "id" UUID NOT NULL,
  "shiftId" UUID NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "description" VARCHAR(255) NOT NULL,
  "receiptNumber" VARCHAR(64),
  "actorId" UUID NOT NULL,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cash_expenses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cash_shifts_branchId_status_idx" ON "cash_shifts"("branchId", "status");
CREATE INDEX "cash_shifts_cashierId_openedAt_idx" ON "cash_shifts"("cashierId", "openedAt");
CREATE INDEX "cash_expenses_shiftId_occurredAt_idx" ON "cash_expenses"("shiftId", "occurredAt");

ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_expenses" ADD CONSTRAINT "cash_expenses_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "cash_shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_expenses" ADD CONSTRAINT "cash_expenses_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
