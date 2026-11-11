CREATE TYPE "biography_format" AS ENUM('plain', 'rich');--> statement-breakpoint
ALTER TABLE "dancer_achievements" ADD COLUMN "position" integer;--> statement-breakpoint
ALTER TABLE "dancer_profiles" ADD COLUMN "biography_format" "biography_format" DEFAULT 'plain'::"biography_format" NOT NULL;--> statement-breakpoint
ALTER TABLE "dancer_references" ADD COLUMN "position" integer;--> statement-breakpoint
ALTER TABLE "profile_images" ADD COLUMN "position" integer;--> statement-breakpoint
ALTER TABLE "profile_videos" ADD COLUMN "position" integer;