ALTER TABLE "user_subscriptions" DROP CONSTRAINT "user_subscriptions_customer_id_key";--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "price_id" text;