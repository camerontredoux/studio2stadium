import { db } from "#database/connection";
import { danceEvents } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

type SchoolProfileWhere = NonNullable<
  Parameters<typeof db.query.schoolProfiles.findMany>[0]
>["where"];

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(filters: Validator, override: boolean) {
    const wheres = this.buildFilters(filters);

    const schools = await this.db.use((db) =>
      db.query.schoolProfiles.findMany({
        where: {
          ...wheres,
          user: {
            role: override ? undefined : "user",
          },
        },
        columns: {
          id: true,
          name: true,
          location: true,
          division: true,
          gpa: true,
          size: true,
          createdAt: true,
        },
        with: {
          user: {
            columns: {
              avatar: true,
              username: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
        extras: {
          events: (table) =>
            db.$count(danceEvents, eq(danceEvents.schoolId, table.id)),
        },
      })
    );

    return schools;
  }

  buildFilters(filters: Validator) {
    const where: SchoolProfileWhere = {};

    if (filters.upcomingEvents) {
      where.events = {
        startDatetime: {
          gte: new Date(),
        },
      };
    }
    if (filters.location) {
      where.location = filters.location;
    }
    if (filters.gpaRange) {
      where.gpa = {
        gte: filters.gpaRange.min,
        lte: filters.gpaRange.max,
      };
    }
    if (filters.division) {
      where.division = {
        in: filters.division,
      };
    }
    if (filters.sports) {
      where.sports = {
        slug: {
          in: filters.sports,
        },
      };
    }
    if (filters.styles) {
      where.styles = {
        slug: {
          in: filters.styles,
        },
      };
    }

    return where;
  }
}
