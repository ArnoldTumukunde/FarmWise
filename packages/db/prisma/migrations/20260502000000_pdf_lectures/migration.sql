-- Add PDF as a first-class lecture type. PDFs are stored in Cloudinary as
-- resource_type=raw and viewed in-browser via signed short-lived URLs.

ALTER TYPE "LectureType" ADD VALUE 'PDF';

ALTER TABLE "Lecture"
  ADD COLUMN "pdfPublicId"  TEXT,
  ADD COLUMN "pdfPageCount" INTEGER;
