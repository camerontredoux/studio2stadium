CREATE TABLE "csv_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"type" "org_member_type" NOT NULL,
	"file_url" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"rows_added" integer DEFAULT 0 NOT NULL,
	"rows_updated" integer DEFAULT 0 NOT NULL,
	"rows_errored" integer DEFAULT 0 NOT NULL,
	"error_details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_dancer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"roster_id" uuid NOT NULL UNIQUE,
	"profile_photo_url" text,
	"grad_year" integer,
	"gpa" double precision,
	"studio" text,
	"state" text,
	"height" text,
	"dance_styles" text[],
	"bio" text,
	"extra" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_rosters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"user_id" uuid,
	"type" "org_member_type" NOT NULL,
	"bib_number" integer,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"organization" text,
	"is_registered" boolean DEFAULT false NOT NULL,
	"expiration_date" date,
	"csv_upload_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"org_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"venue_name" text,
	"venue_address" text,
	"contact_email" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"schedule_pdf_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "csv_uploads_event_id_created_at_index" ON "csv_uploads" ("event_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "event_rosters_event_id_email_index" ON "event_rosters" ("event_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "event_rosters_bib_per_event" ON "event_rosters" ("event_id","bib_number") WHERE bib_number IS NOT NULL;--> statement-breakpoint
CREATE INDEX "event_rosters_event_id_type_index" ON "event_rosters" ("event_id","type");--> statement-breakpoint
CREATE INDEX "event_rosters_user_id_index" ON "event_rosters" ("user_id");--> statement-breakpoint
CREATE INDEX "org_events_org_id_index" ON "org_events" ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_events_one_active_per_org" ON "org_events" ("org_id") WHERE is_active = true;--> statement-breakpoint
ALTER TABLE "csv_uploads" ADD CONSTRAINT "csv_uploads_event_id_org_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "org_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "csv_uploads" ADD CONSTRAINT "csv_uploads_uploaded_by_users_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "event_dancer_profiles" ADD CONSTRAINT "event_dancer_profiles_roster_id_event_rosters_id_fkey" FOREIGN KEY ("roster_id") REFERENCES "event_rosters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_rosters" ADD CONSTRAINT "event_rosters_event_id_org_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "org_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_rosters" ADD CONSTRAINT "event_rosters_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "org_events" ADD CONSTRAINT "org_events_org_id_organizations_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;