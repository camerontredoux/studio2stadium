import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ cursor }: Validator) {
    const schools = await this.db.use((db) =>
      db.query.schoolProfiles.findMany({
        where: cursor
          ? {
              name: {
                gt: cursor,
              },
            }
          : undefined,
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
        limit: 20,
      })
    );

    return {
      schools,
      nextCursor:
        schools.length > 0 ? schools[schools.length - 1].name : undefined,
    };
  }
}
