CREATE TYPE "org_account_tier" AS ENUM('standard', 'limited');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "org_account_tier" "org_account_tier";