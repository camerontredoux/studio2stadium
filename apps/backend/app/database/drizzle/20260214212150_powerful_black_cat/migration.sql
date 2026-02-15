ALTER TABLE "feed" ALTER COLUMN "content_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "feed_item_type";--> statement-breakpoint
CREATE TYPE "feed_item_type" AS ENUM('image', 'video', 'profile', 'reference', 'achievement');--> statement-breakpoint
ALTER TABLE "feed" ALTER COLUMN "content_type" SET DATA TYPE "feed_item_type" USING "content_type"::"feed_item_type";