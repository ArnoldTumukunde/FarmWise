-- AlterTable: Course
ALTER TABLE "Course" ADD COLUMN "moderationFeedback" TEXT;

-- AlterTable: Coupon
ALTER TABLE "Coupon" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: Profile
ALTER TABLE "Profile" ADD COLUMN "farmSize" TEXT;
ALTER TABLE "Profile" ADD COLUMN "yearsExperience" INTEGER;

-- CreateTable: Announcement
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentTo" TEXT NOT NULL DEFAULT 'ALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Announcement_courseId_createdAt_idx" ON "Announcement"("courseId", "createdAt");

ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
