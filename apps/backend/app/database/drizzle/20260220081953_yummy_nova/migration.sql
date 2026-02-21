ALTER TABLE "crv_submissions" ALTER COLUMN "status" SET DEFAULT 'pending'::"prospect_status";--> statement-breakpoint
ALTER TABLE "crv_submissions" ALTER COLUMN "watched" SET DEFAULT false;