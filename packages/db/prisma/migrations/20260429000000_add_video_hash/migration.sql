ALTER TABLE "Lecture" ADD COLUMN "videoHash" VARCHAR(64);
CREATE INDEX "Lecture_videoHash_idx" ON "Lecture"("videoHash");
