import { BaseCommand } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";

/**
 * Shared seed routine so it can be reused from scripts, tests, or the Ace
 * command below without instantiating a BaseCommand (whose constructor
 * requires the Ace runtime).
 */
export async function seedOrganizations() {
  const rows = [
    {
      slug: "core",
      name: "Studio 2 Stadium",
      features: {},
      settings: {},
    },
    {
      slug: "prodigy",
      name: "Prodigy",
      features: {},
      settings: {},
    },
    {
      slug: "summit",
      name: "Sharpen Up - The Summit",
      primaryColor: "#1a1a2e",
      accentColor: "#e94560",
      features: {
        callbacks: true,
        qna: true,
        school_selections: true,
        video_library: true,
        video_coach_assignment: false,
        video_dancer_assignment: false,
        schedule_pdf: true,
      },
      settings: {
        premium_period_days: 90,
        max_school_selections: 3,
        rating_scale_max: 10,
        registration_url_path: "SharpenUpSummit",
      },
    },
  ];

  await db
    .insert(organizations)
    .values(rows)
    .onConflictDoNothing({ target: organizations.slug });

  return rows.length;
}

export default class BackfillOrganizations extends BaseCommand {
  static commandName = "backfill:organizations";
  static description = "Seed core/prodigy/summit organizations";

  static options: CommandOptions = {
    startApp: true,
  };

  async run() {
    const count = await seedOrganizations();
    this.logger.success(`Ensured ${count} organizations.`);
  }
}
