CREATE UNIQUE INDEX "cash_shifts_one_open_per_branch_idx"
  ON "cash_shifts" ("branchId")
  WHERE "status" = 'open';
