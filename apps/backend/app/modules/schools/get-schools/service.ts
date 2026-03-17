import { db } from "#database/connection";
import { danceEvents } from "#database/schema/events";
import { follows } from "#database/schema/profiles";
import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

type SchoolProfileWhere = NonNullable<
  Parameters<typeof db.query.schoolProfiles.findMany>[0]
>["where"];

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(filters: Validator, override: boolean, userId: string) {
    const wheres = this.buildFilters(filters, userId);

    const schools = await this.db.use((db) =>
      db.query.schoolProfiles.findMany({
        where: {
          ...wheres,
          user: {
            role: override ? undefined : "user",
            verified: true,
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
          application: {
            columns: {
              status: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
        extras: {
          events: (table) =>
            db.$count(danceEvents, eq(danceEvents.schoolId, table.id)),
          followers: (table) =>
            db.$count(follows, eq(follows.schoolId, table.id)),
        },
      })
    );

    return schools.flatMap((school) => {
      if (!school.user) return [];
      if (
        school.application?.status === "pending" ||
        school.application?.status === "rejected"
      )
        return [];

      const { user, application, ...schoolProfile } = school;

      return [
        {
          ...schoolProfile,
          username: user.username,
          avatar: imageUrl(user.avatar, "avatar"),
        },
      ];
    });
  }

  buildFilters(filters: Validator, userId: string) {
    const where: SchoolProfileWhere = {};

    if (filters.following) {
      where.followers = {
        userId,
      };
    }
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
    if (filters.competitiveCircuit) {
      where.competitiveCircuit = filters.competitiveCircuit;
    }
    if (filters.teamSelection) {
      where.teamSelection = filters.teamSelection;
    }

    return where;
  }
}
