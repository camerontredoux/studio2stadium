CREATE TABLE "global_dance_event_attendees" (
	"event_id" uuid,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "global_dance_event_attendees_pkey" PRIMARY KEY("user_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "global_dance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" text NOT NULL,
	"thumbnail" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"website" text NOT NULL,
	"organization" text NOT NULL,
	"start_datetime" timestamp NOT NULL,
	"end_datetime" timestamp NOT NULL,
	"type" "dance_event_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "global_dance_event_attendees" ADD CONSTRAINT "global_dance_event_attendees_VAnWZ7akpnDz_fkey" FOREIGN KEY ("event_id") REFERENCES "global_dance_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "global_dance_event_attendees" ADD CONSTRAINT "global_dance_event_attendees_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;