CREATE TABLE "org_dancer_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"org_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token" varchar(64) NOT NULL UNIQUE,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "org_dancer_invites_org_id_email_index" ON "org_dancer_invites" ("org_id","email");--> statement-breakpoint
CREATE INDEX "org_dancer_invites_token_index" ON "org_dancer_invites" ("token");--> statement-breakpoint
ALTER TABLE "org_dancer_invites" ADD CONSTRAINT "org_dancer_invites_org_id_organizations_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;