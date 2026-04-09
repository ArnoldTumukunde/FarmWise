-- CreateTable
CREATE TABLE "PlatformConfig" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "HomepageSection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomepageSection_key_key" ON "HomepageSection"("key");

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default homepage sections
INSERT INTO "HomepageSection" ("id", "key", "label", "enabled", "order", "config", "updatedAt") VALUES
  ('hp_hero',         'hero',         'Hero Banner',           true, 0, '{"title":"Learn farming skills that grow your harvest","subtitle":"Join thousands of farmers mastering modern agriculture"}', NOW()),
  ('hp_categories',   'categories',   'Category Carousel',     true, 1, '{}', NOW()),
  ('hp_stats',        'stats',        'Stats Strip',           true, 2, '{}', NOW()),
  ('hp_featured',     'featured',     'Featured Courses',      true, 3, '{}', NOW()),
  ('hp_howitworks',   'howItWorks',   'How It Works',          true, 4, '{}', NOW()),
  ('hp_instructors',  'instructors',  'Featured Instructors',  true, 5, '{}', NOW()),
  ('hp_testimonials', 'testimonials', 'Testimonials',          true, 6, '{}', NOW()),
  ('hp_teachcta',     'teachCTA',     'Teach CTA',             true, 7, '{}', NOW()),
  ('hp_faq',          'faq',          'FAQ',                   true, 8, '{}', NOW());
