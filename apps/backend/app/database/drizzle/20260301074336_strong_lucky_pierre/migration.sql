CREATE TYPE "school_application_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TABLE "school_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"school_id" uuid NOT NULL UNIQUE,
	"id_type" text NOT NULL,
	"media_id" text NOT NULL,
	"status" "school_application_status" DEFAULT 'pending'::"school_application_status" NOT NULL,
	"location" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dancer_profiles" ADD CONSTRAINT "dancer_profiles_user_id_key" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "school_profiles" ADD CONSTRAINT "school_profiles_user_id_key" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "school_applications" ADD CONSTRAINT "school_applications_school_id_school_profiles_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE;