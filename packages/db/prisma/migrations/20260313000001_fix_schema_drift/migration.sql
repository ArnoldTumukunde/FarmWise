-- Fix schema drift: align database with schema.prisma
-- Enum values were already added in the previous migration.

-- ============================================================================
-- 1. MISSING TABLES
-- ============================================================================

-- InstructorApplication table
CREATE TABLE IF NOT EXISTS "InstructorApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "motivation" TEXT NOT NULL,
    "expertise" TEXT[],
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstructorApplication_pkey" PRIMARY KEY ("id")
);

-- ReviewUpvote junction table
CREATE TABLE IF NOT EXISTS "ReviewUpvote" (
    "userId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,

    CONSTRAINT "ReviewUpvote_pkey" PRIMARY KEY ("userId","reviewId")
);

-- ============================================================================
-- 2. MISSING / RENAMED COLUMNS
-- ============================================================================

-- Profile: add Stripe Connect fields
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "stripeConnectStatus" TEXT;

-- Course: add denormalized counters and isFeatured
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "averageRating" DECIMAL(3,2) NOT NULL DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "enrollmentCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "totalDuration" INTEGER NOT NULL DEFAULT 0;

-- Course: fix price precision from DECIMAL(65,30) to DECIMAL(10,2)
ALTER TABLE "Course" ALTER COLUMN "price" TYPE DECIMAL(10,2);

-- Enrollment: rename paymentId -> stripeSessionId, add paymentIntentId
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Enrollment' AND column_name = 'paymentId'
    ) THEN
        ALTER TABLE "Enrollment" RENAME COLUMN "paymentId" TO "stripeSessionId";
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Enrollment' AND column_name = 'stripeSessionId'
    ) THEN
        ALTER TABLE "Enrollment" ADD COLUMN "stripeSessionId" TEXT;
    END IF;
END $$;

ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "paymentIntentId" TEXT;

-- Enrollment: change default status from ACTIVE to PENDING
ALTER TABLE "Enrollment" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"EnrollmentStatus";

-- Cart: add createdAt (was missing from original migration)
ALTER TABLE "Cart" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Review: add editableUntil column
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "editableUntil" TIMESTAMP(3);

-- ============================================================================
-- 3. MISSING INDEXES
-- ============================================================================

-- Course indexes for denormalized fields
CREATE INDEX IF NOT EXISTS "Course_averageRating_idx" ON "Course"("averageRating");
CREATE INDEX IF NOT EXISTS "Course_enrollmentCount_idx" ON "Course"("enrollmentCount");
CREATE INDEX IF NOT EXISTS "Course_isFeatured_idx" ON "Course"("isFeatured");

-- Enrollment indexes for Stripe webhook lookups
CREATE INDEX IF NOT EXISTS "Enrollment_stripeSessionId_idx" ON "Enrollment"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "Enrollment_paymentIntentId_idx" ON "Enrollment"("paymentIntentId");

-- InstructorApplication indexes
CREATE INDEX IF NOT EXISTS "InstructorApplication_userId_idx" ON "InstructorApplication"("userId");
CREATE INDEX IF NOT EXISTS "InstructorApplication_status_idx" ON "InstructorApplication"("status");

-- ReviewUpvote index
CREATE INDEX IF NOT EXISTS "ReviewUpvote_reviewId_idx" ON "ReviewUpvote"("reviewId");

-- TagsOnCourses index
CREATE INDEX IF NOT EXISTS "TagsOnCourses_tagId_idx" ON "TagsOnCourses"("tagId");

-- Resource index
CREATE INDEX IF NOT EXISTS "Resource_lectureId_idx" ON "Resource"("lectureId");

-- LectureProgress indexes
CREATE INDEX IF NOT EXISTS "LectureProgress_enrollmentId_idx" ON "LectureProgress"("enrollmentId");
CREATE INDEX IF NOT EXISTS "LectureProgress_userId_idx" ON "LectureProgress"("userId");

-- AnswerUpvote index
CREATE INDEX IF NOT EXISTS "AnswerUpvote_answerId_idx" ON "AnswerUpvote"("answerId");

-- Note userId index
CREATE INDEX IF NOT EXISTS "Note_userId_idx" ON "Note"("userId");

-- Question userId index
CREATE INDEX IF NOT EXISTS "Question_userId_idx" ON "Question"("userId");

-- ============================================================================
-- 4. MISSING FOREIGN KEYS
-- ============================================================================

-- InstructorApplication foreign keys
DO $$ BEGIN
    ALTER TABLE "InstructorApplication" ADD CONSTRAINT "InstructorApplication_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "InstructorApplication" ADD CONSTRAINT "InstructorApplication_reviewedBy_fkey"
        FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ReviewUpvote foreign keys
DO $$ BEGIN
    ALTER TABLE "ReviewUpvote" ADD CONSTRAINT "ReviewUpvote_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "ReviewUpvote" ADD CONSTRAINT "ReviewUpvote_reviewId_fkey"
        FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AnswerUpvote: add missing userId foreign key
DO $$ BEGIN
    ALTER TABLE "AnswerUpvote" ADD CONSTRAINT "AnswerUpvote_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- LectureProgress: add missing userId foreign key
DO $$ BEGIN
    ALTER TABLE "LectureProgress" ADD CONSTRAINT "LectureProgress_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 5. CASCADE DELETE CHANGES (RESTRICT -> CASCADE)
-- ============================================================================

-- TagsOnCourses -> Course (Cascade)
ALTER TABLE "TagsOnCourses" DROP CONSTRAINT IF EXISTS "TagsOnCourses_courseId_fkey";
ALTER TABLE "TagsOnCourses" ADD CONSTRAINT "TagsOnCourses_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TagsOnCourses -> Tag (Cascade)
ALTER TABLE "TagsOnCourses" DROP CONSTRAINT IF EXISTS "TagsOnCourses_tagId_fkey";
ALTER TABLE "TagsOnCourses" ADD CONSTRAINT "TagsOnCourses_tagId_fkey"
    FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Section -> Course (Cascade)
ALTER TABLE "Section" DROP CONSTRAINT IF EXISTS "Section_courseId_fkey";
ALTER TABLE "Section" ADD CONSTRAINT "Section_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Lecture -> Section (Cascade)
ALTER TABLE "Lecture" DROP CONSTRAINT IF EXISTS "Lecture_sectionId_fkey";
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_sectionId_fkey"
    FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Resource -> Lecture (Cascade)
ALTER TABLE "Resource" DROP CONSTRAINT IF EXISTS "Resource_lectureId_fkey";
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_lectureId_fkey"
    FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CartItem -> Cart (Cascade)
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_cartId_fkey";
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey"
    FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- LectureProgress -> Lecture (Cascade)
ALTER TABLE "LectureProgress" DROP CONSTRAINT IF EXISTS "LectureProgress_lectureId_fkey";
ALTER TABLE "LectureProgress" ADD CONSTRAINT "LectureProgress_lectureId_fkey"
    FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- LectureProgress -> Enrollment (Cascade)
ALTER TABLE "LectureProgress" DROP CONSTRAINT IF EXISTS "LectureProgress_enrollmentId_fkey";
ALTER TABLE "LectureProgress" ADD CONSTRAINT "LectureProgress_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- OfflineDownload -> Lecture (Cascade)
ALTER TABLE "OfflineDownload" DROP CONSTRAINT IF EXISTS "OfflineDownload_lectureId_fkey";
ALTER TABLE "OfflineDownload" ADD CONSTRAINT "OfflineDownload_lectureId_fkey"
    FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- OfflineDownload -> Enrollment (Cascade)
ALTER TABLE "OfflineDownload" DROP CONSTRAINT IF EXISTS "OfflineDownload_enrollmentId_fkey";
ALTER TABLE "OfflineDownload" ADD CONSTRAINT "OfflineDownload_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note -> Lecture (Cascade)
ALTER TABLE "Note" DROP CONSTRAINT IF EXISTS "Note_lectureId_fkey";
ALTER TABLE "Note" ADD CONSTRAINT "Note_lectureId_fkey"
    FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
