CREATE TABLE "dancer_sports" (
	"dancer_id" uuid,
	"sport_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dancer_sports_pkey" PRIMARY KEY("dancer_id","sport_id")
);
--> statement-breakpoint
CREATE TABLE "school_sports" (
	"school_id" uuid,
	"sport_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_sports_pkey" PRIMARY KEY("school_id","sport_id")
);
--> statement-breakpoint
CREATE TABLE "profile_sports" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dancer_sports" ADD CONSTRAINT "dancer_sports_dancer_id_dancer_profiles_id_fkey" FOREIGN KEY ("dancer_id") REFERENCES "dancer_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dancer_sports" ADD CONSTRAINT "dancer_sports_sport_id_profile_sports_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "profile_sports"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "school_sports" ADD CONSTRAINT "school_sports_school_id_school_profiles_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "school_sports" ADD CONSTRAINT "school_sports_sport_id_profile_sports_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "profile_sports"("id") ON DELETE CASCADE ON UPDATE CASCADE;