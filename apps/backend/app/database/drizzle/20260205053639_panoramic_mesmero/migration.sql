ALTER TABLE "dancer_skills" DROP CONSTRAINT "dancers_to_skills_skill_id_profile_skills_id_fkey";--> statement-breakpoint
ALTER TABLE "school_skills" DROP CONSTRAINT "schools_to_skills_skill_id_profile_skills_id_fkey";--> statement-breakpoint
ALTER TABLE "dancer_styles" DROP CONSTRAINT "dancers_to_styles_style_id_profile_styles_id_fkey";--> statement-breakpoint
ALTER TABLE "school_styles" DROP CONSTRAINT "schools_to_styles_style_id_profile_styles_id_fkey";--> statement-breakpoint
ALTER TABLE "dancer_sports" DROP CONSTRAINT "dancer_sports_sport_id_profile_sports_id_fkey";--> statement-breakpoint
ALTER TABLE "school_sports" DROP CONSTRAINT "school_sports_sport_id_profile_sports_id_fkey";--> statement-breakpoint
ALTER TABLE "profile_skills" DROP CONSTRAINT "profile_skills_name_key";--> statement-breakpoint
ALTER TABLE "profile_styles" DROP CONSTRAINT "profile_styles_name_key";--> statement-breakpoint
ALTER TABLE "profile_sports" DROP CONSTRAINT "profile_sports_name_key";--> statement-breakpoint
ALTER TABLE "profile_skills" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "profile_styles" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "profile_sports" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "profile_skills" ADD PRIMARY KEY ("name");--> statement-breakpoint
ALTER TABLE "profile_styles" ADD PRIMARY KEY ("name");--> statement-breakpoint
ALTER TABLE "profile_sports" ADD PRIMARY KEY ("name");--> statement-breakpoint
ALTER TABLE "dancer_skills" ADD CONSTRAINT "dancer_skills_skill_id_profile_skills_name_fkey" FOREIGN KEY ("skill_id") REFERENCES "profile_skills"("name") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "school_skills" ADD CONSTRAINT "school_skills_skill_id_profile_skills_name_fkey" FOREIGN KEY ("skill_id") REFERENCES "profile_skills"("name") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "dancer_styles" ADD CONSTRAINT "dancer_styles_style_id_profile_styles_name_fkey" FOREIGN KEY ("style_id") REFERENCES "profile_styles"("name") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "school_styles" ADD CONSTRAINT "school_styles_style_id_profile_styles_name_fkey" FOREIGN KEY ("style_id") REFERENCES "profile_styles"("name") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "dancer_sports" ADD CONSTRAINT "dancer_sports_sport_id_profile_sports_name_fkey" FOREIGN KEY ("sport_id") REFERENCES "profile_sports"("name") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "school_sports" ADD CONSTRAINT "school_sports_sport_id_profile_sports_name_fkey" FOREIGN KEY ("sport_id") REFERENCES "profile_sports"("name") ON DELETE CASCADE ON UPDATE CASCADE;