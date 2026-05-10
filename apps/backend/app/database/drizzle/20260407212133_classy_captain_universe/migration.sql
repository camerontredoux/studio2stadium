CREATE TYPE "org_member_type" AS ENUM('coach', 'dancer');--> statement-breakpoint
CREATE TYPE "org_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TYPE "premium_grant_source" AS ENUM('org_event');--> statement-breakpoint
CREATE TABLE "org_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"role" "org_role" DEFAULT 'member'::"org_role" NOT NULL,
	"type" "org_member_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(128) NOT NULL,
	"slug" varchar(64) NOT NULL UNIQUE,
	"logo_url" text,
	"primary_color" varchar(16),
	"accent_color" varchar(16),
	"features" jsonb DEFAULT '{}' NOT NULL,
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premium_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"source_type" "premium_grant_source" NOT NULL,
	"source_id" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "org_memberships_user_id_org_id_index" ON "org_memberships" ("user_id","org_id");--> statement-breakpoint
CREATE INDEX "org_memberships_org_id_index" ON "org_memberships" ("org_id");--> statement-breakpoint
CREATE INDEX "org_memberships_user_id_index" ON "org_memberships" ("user_id");--> statement-breakpoint
CREATE INDEX "organizations_slug_index" ON "organizations" ("slug");--> statement-breakpoint
CREATE INDEX "premium_grants_user_id_expires_at_index" ON "premium_grants" ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "premium_grants_expires_at_index" ON "premium_grants" ("expires_at");--> statement-breakpoint
ALTER TABLE "org_memberships" ADD CONSTRAINT "org_memberships_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "org_memberships" ADD CONSTRAINT "org_memberships_org_id_organizations_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "premium_grants" ADD CONSTRAINT "premium_grants_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;