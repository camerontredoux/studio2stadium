ALTER TABLE "dancers_to_skills" RENAME TO "dancer_skills";--> statement-breakpoint
ALTER TABLE "schools_to_skills" RENAME TO "school_skills";--> statement-breakpoint
ALTER TABLE "profile_skills" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_skills" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_styles" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_styles" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;