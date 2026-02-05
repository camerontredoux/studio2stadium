import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ ...filters }: Validator, override: boolean) {
    const where: any = {};
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

    const schools = await this.db.use((db) =>
      db.query.schoolProfiles.findMany({
        where: {
          ...where,
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
      })
    );

    return schools;
  }
}
