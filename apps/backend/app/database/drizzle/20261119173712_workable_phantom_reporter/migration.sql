CREATE TABLE "featured_placements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"dancer_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"featured_until" timestamp with time zone NOT NULL,
	"paid" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "featured_placements_school_id_featured_until_index" ON "featured_placements" ("school_id","featured_until");--> statement-breakpoint
CREATE INDEX "featured_placements_dancer_id_school_id_created_at_index" ON "featured_placements" ("dancer_id","school_id","created_at");--> statement-breakpoint
ALTER TABLE "featured_placements" ADD CONSTRAINT "featured_placements_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "featured_placements" ADD CONSTRAINT "featured_placements_school_id_school_profiles_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE;