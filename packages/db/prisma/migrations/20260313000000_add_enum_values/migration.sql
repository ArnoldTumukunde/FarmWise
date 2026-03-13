-- Add new enum types and values
-- These must run outside a transaction (ALTER TYPE ... ADD VALUE cannot be transactional)

-- ApplicationStatus enum (for InstructorApplication)
DO $$ BEGIN
    CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add PENDING to EnrollmentStatus
ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'PENDING' BEFORE 'ACTIVE';

-- Add INSTRUCTOR_APPLICATION_REVIEWED to NotificationType
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'INSTRUCTOR_APPLICATION_REVIEWED';
