CREATE TABLE "email_suppressions" (
	"email" citext PRIMARY KEY,
	"source" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "week_pass_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"kind" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"user_id" uuid NOT NULL,
	"week_pass_id" uuid NOT NULL,
	"access_ends_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"claim_token" uuid,
	"claimed_until" timestamp with time zone,
	"suppressed_reason" text,
	"last_error" text,
	"provider_message_id" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "week_pass_emails_kind_check" CHECK ("kind" in ('welcome', 'expired')),
	CONSTRAINT "week_pass_emails_status_check" CHECK ("status" in ('pending', 'sending', 'sent', 'suppressed', 'failed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "week_pass_emails_kind_dedupe_key_index" ON "week_pass_emails" ("kind","dedupe_key");--> statement-breakpoint
CREATE INDEX "week_pass_emails_status_next_attempt_at_index" ON "week_pass_emails" ("status","next_attempt_at");--> statement-breakpoint
ALTER TABLE "week_pass_emails" ADD CONSTRAINT "week_pass_emails_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "week_pass_emails" ADD CONSTRAINT "week_pass_emails_week_pass_id_week_passes_id_fkey" FOREIGN KEY ("week_pass_id") REFERENCES "week_passes"("id") ON DELETE CASCADE;