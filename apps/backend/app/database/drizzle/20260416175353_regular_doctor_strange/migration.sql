CREATE TABLE "school_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"email" text NOT NULL,
	"organization" text,
	"token" text NOT NULL UNIQUE,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggested_claim_dismissals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"roster_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "school_invites_event_email" ON "school_invites" ("event_id","email");--> statement-breakpoint
CREATE INDEX "school_invites_token_index" ON "school_invites" ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "suggested_claim_dismissals_user_roster" ON "suggested_claim_dismissals" ("user_id","roster_id");--> statement-breakpoint
ALTER TABLE "school_invites" ADD CONSTRAINT "school_invites_event_id_org_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "org_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "suggested_claim_dismissals" ADD CONSTRAINT "suggested_claim_dismissals_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "suggested_claim_dismissals" ADD CONSTRAINT "suggested_claim_dismissals_roster_id_event_rosters_id_fkey" FOREIGN KEY ("roster_id") REFERENCES "event_rosters"("id") ON DELETE CASCADE;