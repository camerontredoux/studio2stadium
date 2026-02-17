DROP INDEX "dancer_profiles_grad_year_index";--> statement-breakpoint
CREATE INDEX "dancer_profiles_user_id_index" ON "dancer_profiles" ("user_id");--> statement-breakpoint
CREATE INDEX "dancer_profiles_gpa_index" ON "dancer_profiles" ("gpa");--> statement-breakpoint
CREATE INDEX "profile_images_user_id_index" ON "profile_images" ("user_id");--> statement-breakpoint
CREATE INDEX "profile_videos_user_id_index" ON "profile_videos" ("user_id");--> statement-breakpoint
CREATE INDEX "school_profiles_user_id_index" ON "school_profiles" ("user_id");--> statement-breakpoint
CREATE INDEX "dancer_skills_dancer_id_index" ON "dancer_skills" ("dancer_id");--> statement-breakpoint
CREATE INDEX "school_skills_school_id_index" ON "school_skills" ("school_id");--> statement-breakpoint
CREATE INDEX "dancer_sports_dancer_id_index" ON "dancer_sports" ("dancer_id");--> statement-breakpoint
CREATE INDEX "school_sports_school_id_index" ON "school_sports" ("school_id");--> statement-breakpoint
CREATE INDEX "dancer_styles_dancer_id_index" ON "dancer_styles" ("dancer_id");--> statement-breakpoint
CREATE INDEX "school_styles_school_id_index" ON "school_styles" ("school_id");--> statement-breakpoint
CREATE INDEX "user_platforms_user_id_index" ON "user_platforms" ("user_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_user_id_index" ON "user_subscriptions" ("user_id");