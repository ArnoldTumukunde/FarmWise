-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN indexes for fuzzy search on course title and description
CREATE INDEX IF NOT EXISTS "Course_title_trgm_idx" ON "Course" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Course_description_trgm_idx" ON "Course" USING GIN ("description" gin_trgm_ops);
