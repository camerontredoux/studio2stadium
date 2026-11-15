CREATE TABLE "week_passes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"checkout_session_id" text NOT NULL UNIQUE,
	"payment_intent_id" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "week_passes_user_id_ends_at_index" ON "week_passes" ("user_id","ends_at");--> statement-breakpoint
ALTER TABLE "week_passes" ADD CONSTRAINT "week_passes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;