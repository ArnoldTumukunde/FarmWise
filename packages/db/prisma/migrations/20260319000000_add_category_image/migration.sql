-- AlterTable
ALTER TABLE "Category" ADD COLUMN "imageUrl" TEXT;

-- Seed default images for existing categories
UPDATE "Category" SET "imageUrl" = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80' WHERE "slug" = 'crop-farming';
UPDATE "Category" SET "imageUrl" = 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400&q=80' WHERE "slug" = 'livestock-poultry';
UPDATE "Category" SET "imageUrl" = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80' WHERE "slug" = 'soil-health';
UPDATE "Category" SET "imageUrl" = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' WHERE "slug" = 'pest-disease-control';
UPDATE "Category" SET "imageUrl" = 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80' WHERE "slug" = 'water-irrigation';
UPDATE "Category" SET "imageUrl" = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80' WHERE "slug" = 'agribusiness';
UPDATE "Category" SET "imageUrl" = 'https://images.unsplash.com/photo-1533062618053-d51e617307ec?w=400&q=80' WHERE "slug" = 'post-harvest';
UPDATE "Category" SET "imageUrl" = 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=400&q=80' WHERE "slug" = 'farm-technology';
UPDATE "Category" SET "imageUrl" = 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&q=80' WHERE "slug" = 'climate-environment';
UPDATE "Category" SET "imageUrl" = 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=400&q=80' WHERE "slug" = 'organic-farming';
