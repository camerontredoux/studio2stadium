ALTER TABLE "event_school_selections" ADD COLUMN "rank" integer;--> statement-breakpoint
-- Existing selections keep the order the API showed them in: oldest first.
UPDATE "event_school_selections" AS s SET "rank" = ranked.rank
FROM (
  SELECT "id", row_number() OVER (
    PARTITION BY "event_id", "dancer_roster_id"
    ORDER BY "created_at", "id"
  ) AS rank
  FROM "event_school_selections"
) AS ranked
WHERE s."id" = ranked."id";--> statement-breakpoint
ALTER TABLE "event_school_selections" ALTER COLUMN "rank" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "event_school_selections_event_id_dancer_roster_id_rank_index" ON "event_school_selections" ("event_id","dancer_roster_id","rank");
