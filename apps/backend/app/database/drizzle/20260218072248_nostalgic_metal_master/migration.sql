CREATE TABLE "skill_rarity" (
	"skill_id" text PRIMARY KEY,
	"rarity" real NOT NULL,
	"count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "skill_rarity" ADD CONSTRAINT "skill_rarity_skill_id_profile_skills_slug_fkey" FOREIGN KEY ("skill_id") REFERENCES "profile_skills"("slug") ON DELETE CASCADE;