-- Pesapal API 3.0 cutover + configurable revenue split.
-- Hard-replace migration: no Stripe rows are preserved (no live payments yet).

-- ─── PROFILE ────────────────────────────────────────────────────────────────
ALTER TABLE "Profile" DROP COLUMN IF EXISTS "stripeConnectAccountId";
ALTER TABLE "Profile" DROP COLUMN IF EXISTS "stripeConnectStatus";
ALTER TABLE "Profile" ADD COLUMN "payoutPhone" TEXT;
ALTER TABLE "Profile" ADD COLUMN "payoutBankName" TEXT;
ALTER TABLE "Profile" ADD COLUMN "payoutBankAccount" TEXT;

-- ─── COURSE: per-course override ────────────────────────────────────────────
ALTER TABLE "Course" ADD COLUMN "instructorSharePercent" INTEGER;
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorSharePercent_check"
  CHECK ("instructorSharePercent" IS NULL OR ("instructorSharePercent" >= 0 AND "instructorSharePercent" <= 100));

-- ─── PAYMENT (new) ──────────────────────────────────────────────────────────
CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING', 'COMPLETED', 'FAILED', 'REVERSED',
  'REFUND_REQUESTED', 'REFUNDED', 'CANCELLED'
);

CREATE TABLE "Payment" (
  "id"                  TEXT PRIMARY KEY,
  "userId"              TEXT NOT NULL,
  "merchantReference"   TEXT NOT NULL,
  "orderTrackingId"     TEXT,
  "confirmationCode"    TEXT,
  "amount"              DECIMAL(14, 2) NOT NULL,
  "currency"            TEXT NOT NULL,
  "status"              "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "pesapalStatusCode"   INTEGER,
  "paymentMethod"       TEXT,
  "paymentAccount"      TEXT,
  "failureDescription"  TEXT,
  "refundedAt"          TIMESTAMP(3),
  "refundAmount"        DECIMAL(14, 2),
  "refundRemarks"       TEXT,
  "metadata"            JSONB,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt"              TIMESTAMP(3),
  "updatedAt"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Payment_merchantReference_key" ON "Payment"("merchantReference");
CREATE UNIQUE INDEX "Payment_orderTrackingId_key" ON "Payment"("orderTrackingId");
CREATE UNIQUE INDEX "Payment_confirmationCode_key" ON "Payment"("confirmationCode");
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- ─── PROCESSED IPN (idempotency) ────────────────────────────────────────────
CREATE TABLE "ProcessedPesapalIpn" (
  "orderTrackingId"  TEXT PRIMARY KEY,
  "notificationType" TEXT NOT NULL,
  "receivedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── INSTRUCTOR PAYOUT ──────────────────────────────────────────────────────
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'QUEUED', 'PAID', 'FAILED');

CREATE TABLE "InstructorPayout" (
  "id"            TEXT PRIMARY KEY,
  "instructorId"  TEXT NOT NULL,
  "amount"        DECIMAL(14, 2) NOT NULL,
  "currency"      TEXT NOT NULL,
  "periodStart"   TIMESTAMP(3) NOT NULL,
  "periodEnd"     TIMESTAMP(3) NOT NULL,
  "status"        "PayoutStatus" NOT NULL DEFAULT 'PENDING',
  "reference"     TEXT,
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt"        TIMESTAMP(3),
  CONSTRAINT "InstructorPayout_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "InstructorPayout_instructorId_status_idx" ON "InstructorPayout"("instructorId", "status");
CREATE INDEX "InstructorPayout_createdAt_idx" ON "InstructorPayout"("createdAt");

-- ─── ENROLLMENT: replace Stripe FKs with Pesapal links + split snapshot ─────
DROP INDEX IF EXISTS "Enrollment_stripeSessionId_idx";
DROP INDEX IF EXISTS "Enrollment_paymentIntentId_idx";

ALTER TABLE "Enrollment" DROP COLUMN IF EXISTS "stripeSessionId";
ALTER TABLE "Enrollment" DROP COLUMN IF EXISTS "paymentIntentId";

ALTER TABLE "Enrollment" ALTER COLUMN "paidAmount" TYPE DECIMAL(14, 2);
ALTER TABLE "Enrollment" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'UGX';
ALTER TABLE "Enrollment" ADD COLUMN "instructorSharePercent" INTEGER NOT NULL DEFAULT 70;
ALTER TABLE "Enrollment" ADD COLUMN "paymentId" TEXT;
ALTER TABLE "Enrollment" ADD COLUMN "payoutId" TEXT;

ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_payoutId_fkey"
  FOREIGN KEY ("payoutId") REFERENCES "InstructorPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_instructorSharePercent_check"
  CHECK ("instructorSharePercent" >= 0 AND "instructorSharePercent" <= 100);

CREATE INDEX "Enrollment_paymentId_idx" ON "Enrollment"("paymentId");
CREATE INDEX "Enrollment_payoutId_idx" ON "Enrollment"("payoutId");

-- ─── DROP STRIPE EVENT TABLE ────────────────────────────────────────────────
DROP TABLE IF EXISTS "ProcessedStripeEvent";

-- ─── SEED DEFAULT PLATFORM SHARE ────────────────────────────────────────────
-- Stored as JSON-encoded string to match CmsService convention.
INSERT INTO "PlatformConfig" ("key", "value", "updatedAt")
VALUES ('payments.defaultInstructorSharePercent', '70', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
-- Legacy key removed: platform fee is derived as (100 - defaultInstructorSharePercent).
DELETE FROM "PlatformConfig" WHERE "key" = 'payments.platformFeePercent';
