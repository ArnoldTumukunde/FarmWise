-- Add content field for ARTICLE type lectures
ALTER TABLE "Lecture" ADD COLUMN "content" TEXT;

-- Add quizData field for QUIZ type lectures (stores JSON array of questions)
ALTER TABLE "Lecture" ADD COLUMN "quizData" JSONB;
