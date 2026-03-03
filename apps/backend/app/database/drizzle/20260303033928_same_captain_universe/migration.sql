CREATE TABLE "profile_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"dancer_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "profile_views_dancer_id_school_id_index" ON "profile_views" ("dancer_id","school_id");--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_school_id_school_profiles_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE;