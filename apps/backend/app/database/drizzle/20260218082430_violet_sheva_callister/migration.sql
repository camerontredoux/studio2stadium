CREATE TYPE "competitive_circuit_type" AS ENUM('uda', 'dtu', 'nda', 'usa', 'non-competitive', 'other');--> statement-breakpoint
CREATE TYPE "team_selection_type" AS ENUM('recruitment', 'audition', 'hybrid');--> statement-breakpoint
ALTER TABLE "school_profiles" ADD COLUMN "common_recruiting" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "school_profiles" ADD COLUMN "team_selection" "team_selection_type" DEFAULT 'recruitment'::"team_selection_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "school_profiles" ADD COLUMN "competitive_circuit" "competitive_circuit_type" DEFAULT 'non-competitive'::"competitive_circuit_type" NOT NULL;--> statement-breakpoint
CREATE INDEX "school_profiles_team_selection_index" ON "school_profiles" ("team_selection");--> statement-breakpoint
CREATE INDEX "school_profiles_competitive_circuit_index" ON "school_profiles" ("competitive_circuit");