ALTER TABLE "dancer_interests" ADD COLUMN "count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "dancer_interests" ADD CONSTRAINT "count <= 3" CHECK ("count" <= 3);