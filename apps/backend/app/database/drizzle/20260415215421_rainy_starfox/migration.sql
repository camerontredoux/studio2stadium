CREATE TYPE "audit_action" AS ENUM('upload', 'create', 'update', 'delete', 'activate', 'resend_invite');--> statement-breakpoint
CREATE TYPE "audit_resource" AS ENUM('roster', 'event', 'checklist', 'csv_upload', 'invite');--> statement-breakpoint
CREATE TABLE "event_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"resource" "audit_resource" NOT NULL,
	"resource_id" uuid,
	"metadata" jsonb,
	"parent_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "event_audit_log_event_id_created_at_index" ON "event_audit_log" ("event_id","created_at");--> statement-breakpoint
CREATE INDEX "event_audit_log_parent_id_index" ON "event_audit_log" ("parent_id");--> statement-breakpoint
CREATE INDEX "event_audit_log_actor_id_index" ON "event_audit_log" ("actor_id");--> statement-breakpoint
ALTER TABLE "event_audit_log" ADD CONSTRAINT "event_audit_log_event_id_org_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "org_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_audit_log" ADD CONSTRAINT "event_audit_log_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "event_audit_log" ADD CONSTRAINT "event_audit_log_parent_id_event_audit_log_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "event_audit_log"("id") ON DELETE CASCADE;