import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator) {
    const members = await this.db.use((db) =>
      db.query.orgMemberships.findMany({
        where: { orgId: params.id },
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    );

    return members.map((m) => ({
      id: m.id,
      role: m.role,
      type: m.type,
      createdAt: m.createdAt,
      user: m.user
        ? {
            id: m.user.id,
            email: m.user.email,
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            username: m.user.username,
            avatar: m.user.avatar,
          }
        : null,
    }));
  }
}
