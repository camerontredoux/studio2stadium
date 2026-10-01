CREATE TYPE "purchase_deactivation_reason" AS ENUM('refunded', 'disputed');--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD COLUMN "payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD COLUMN "deactivated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD COLUMN "deactivation_reason" "purchase_deactivation_reason";--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD COLUMN "deactivation_reference" text;--> statement-breakpoint
ALTER TABLE "event_tier_purchases" ADD CONSTRAINT "event_tier_purchases_payment_intent_id_key" UNIQUE("payment_intent_id");