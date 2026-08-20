CREATE TABLE "cron_job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"job" text NOT NULL,
	"run_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "cron_job_runs_job_run_key_index" ON "cron_job_runs" ("job","run_key");