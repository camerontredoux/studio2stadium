CREATE TYPE "roster_claim_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "roster_claim_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"org_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"claimed_first_name" text NOT NULL,
	"claimed_last_name" text NOT NULL,
	"claimed_email" citext,
	"note" text,
	"status" "roster_claim_status" DEFAULT 'pending'::"roster_claim_status" NOT NULL,
	"resolved_roster_id" uuid,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "roster_claim_requests_org_id_status_index" ON "roster_claim_requests" ("org_id","status");--> statement-breakpoint
CREATE INDEX "roster_claim_requests_requester_id_index" ON "roster_claim_requests" ("requester_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roster_claim_requests_one_open_per_requester" ON "roster_claim_requests" ("org_id","requester_id") WHERE status = 'pending';--> statement-breakpoint
ALTER TABLE "roster_claim_requests" ADD CONSTRAINT "roster_claim_requests_org_id_organizations_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "roster_claim_requests" ADD CONSTRAINT "roster_claim_requests_requester_id_users_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "roster_claim_requests" ADD CONSTRAINT "roster_claim_requests_resolved_roster_id_event_rosters_id_fkey" FOREIGN KEY ("resolved_roster_id") REFERENCES "event_rosters"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "roster_claim_requests" ADD CONSTRAINT "roster_claim_requests_resolved_by_users_id_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL;