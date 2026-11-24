CREATE TABLE "promotion_code_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"promotion_code_id" text NOT NULL,
	"checkout_session_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "promotion_code_redemptions_user_id_code_index" ON "promotion_code_redemptions" ("user_id","code");--> statement-breakpoint
ALTER TABLE "promotion_code_redemptions" ADD CONSTRAINT "promotion_code_redemptions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;