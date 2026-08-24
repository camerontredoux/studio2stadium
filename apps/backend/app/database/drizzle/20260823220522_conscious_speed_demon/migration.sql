CREATE TYPE "csv_row_outcome" AS ENUM('added', 'updated');--> statement-breakpoint
CREATE TABLE "csv_upload_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"csv_upload_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"email" citext NOT NULL,
	"first_name" text,
	"last_name" text,
	"bib_number" integer,
	"paid" boolean,
	"outcome" "csv_row_outcome" NOT NULL,
	"roster_id" uuid,
	"matched_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "csv_upload_rows_csv_upload_id_index" ON "csv_upload_rows" ("csv_upload_id");--> statement-breakpoint
CREATE INDEX "csv_upload_rows_email_index" ON "csv_upload_rows" ("email");--> statement-breakpoint
CREATE INDEX "csv_upload_rows_roster_id_index" ON "csv_upload_rows" ("roster_id");--> statement-breakpoint
ALTER TABLE "csv_upload_rows" ADD CONSTRAINT "csv_upload_rows_csv_upload_id_csv_uploads_id_fkey" FOREIGN KEY ("csv_upload_id") REFERENCES "csv_uploads"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "csv_upload_rows" ADD CONSTRAINT "csv_upload_rows_roster_id_event_rosters_id_fkey" FOREIGN KEY ("roster_id") REFERENCES "event_rosters"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "csv_upload_rows" ADD CONSTRAINT "csv_upload_rows_matched_user_id_users_id_fkey" FOREIGN KEY ("matched_user_id") REFERENCES "users"("id") ON DELETE SET NULL;