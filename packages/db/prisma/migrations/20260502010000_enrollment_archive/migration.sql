-- Per-user archive flag on Enrollment. Hides from My Learning and pauses
-- progress recording. Independent of status (PENDING/ACTIVE/REFUNDED).

ALTER TABLE "Enrollment"
  ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "Enrollment_userId_isArchived_idx" ON "Enrollment"("userId", "isArchived");
