ALTER TABLE "dancer_skills" DROP CONSTRAINT "dancer_skills_skill_id_profile_skills_name_fkey";--> statement-breakpoint
ALTER TABLE "school_skills" DROP CONSTRAINT "school_skills_skill_id_profile_skills_name_fkey";--> statement-breakpoint
ALTER TABLE "dancer_styles" DROP CONSTRAINT "dancer_styles_style_id_profile_styles_name_fkey";--> statement-breakpoint
ALTER TABLE "school_styles" DROP CONSTRAINT "school_styles_style_id_profile_styles_name_fkey";--> statement-breakpoint
ALTER TABLE "dancer_sports" DROP CONSTRAINT "dancer_sports_sport_id_profile_sports_name_fkey";--> statement-breakpoint
ALTER TABLE "school_sports" DROP CONSTRAINT "school_sports_sport_id_profile_sports_name_fkey";--> statement-breakpoint
ALTER TABLE "profile_skills" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "profile_styles" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "profile_sports" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "profile_sports" SET slug = lower(replace(name, ' ', '-'));--> statement-breakpoint
ALTER TABLE "profile_skills" DROP CONSTRAINT "profile_skills_pkey";--> statement-breakpoint
ALTER TABLE "profile_skills" ADD PRIMARY KEY ("slug");--> statement-breakpoint
ALTER TABLE "profile_styles" DROP CONSTRAINT "profile_styles_pkey";--> statement-breakpoint
ALTER TABLE "profile_styles" ADD PRIMARY KEY ("slug");--> statement-breakpoint
ALTER TABLE "profile_sports" DROP CONSTRAINT "profile_sports_pkey";--> statement-breakpoint
ALTER TABLE "profile_sports" ADD PRIMARY KEY ("slug");--> statement-breakpoint
ALTER TABLE "profile_skills" ADD CONSTRAINT "profile_skills_name_key" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "profile_styles" ADD CONSTRAINT "profile_styles_name_key" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "profile_sports" ADD CONSTRAINT "profile_sports_name_key" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "dancer_skills" ADD CONSTRAINT "dancer_skills_skill_id_profile_skills_slug_fkey" FOREIGN KEY ("skill_id") REFERENCES "profile_skills"("slug") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "school_skills" ADD CONSTRAINT "school_skills_skill_id_profile_skills_slug_fkey" FOREIGN KEY ("skill_id") REFERENCES "profile_skills"("slug") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "dancer_styles" ADD CONSTRAINT "dancer_styles_style_id_profile_styles_slug_fkey" FOREIGN KEY ("style_id") REFERENCES "profile_styles"("slug") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "school_styles" ADD CONSTRAINT "school_styles_style_id_profile_styles_slug_fkey" FOREIGN KEY ("style_id") REFERENCES "profile_styles"("slug") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "dancer_sports" ADD CONSTRAINT "dancer_sports_sport_id_profile_sports_slug_fkey" FOREIGN KEY ("sport_id") REFERENCES "profile_sports"("slug") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "school_sports" ADD CONSTRAINT "school_sports_sport_id_profile_sports_slug_fkey" FOREIGN KEY ("sport_id") REFERENCES "profile_sports"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
