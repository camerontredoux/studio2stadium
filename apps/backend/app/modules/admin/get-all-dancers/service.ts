import { dancerProfiles } from "#database/schema/dancers";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";
import { asc, desc, eq, sql, type AnyColumn } from "drizzle-orm";
import { type SortableColumn, type Validator } from "./validator.ts";

const sortColumnMap = {
  createdAt: dancerProfiles.createdAt,
  location: dancerProfiles.location,
  gpa: dancerProfiles.gpa,
  gradYear: dancerProfiles.gradYear,
  username: users.username,
  firstName: users.firstName,
  lastName: users.lastName,
  verified: users.verified,
  email: users.displayEmail,
} satisfies Record<SortableColumn, AnyColumn>;

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(params: Validator) {
    const limit = params.limit ?? 20;
    const offset = params.page ? params.page * limit : 0;
    const sortBy = params.sortBy ?? "createdAt";
    const sortDirection = params.sortDirection ?? "desc";
    const sortColumn = sortColumnMap[sortBy];
    const orderBy =
      sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);

    const [data, countResult] = await Promise.all([
      this.db.use((db) =>
        db
          .select({
            id: dancerProfiles.id,
            location: dancerProfiles.location,
            gpa: dancerProfiles.gpa,
            gradYear: dancerProfiles.gradYear,
            createdAt: dancerProfiles.createdAt,
            userId: users.id,
            username: users.username,
            displayEmail: users.displayEmail,
            firstName: users.firstName,
            lastName: users.lastName,
            avatar: users.avatar,
            verified: users.verified,
            role: users.role,
          })
          .from(dancerProfiles)
          .innerJoin(users, eq(dancerProfiles.userId, users.id))
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset)
      ),
      this.db.use((db) =>
        db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(dancerProfiles)
          .innerJoin(users, eq(dancerProfiles.userId, users.id))
      ),
    ]);

    const total = countResult[0]?.count ?? 0;

    const dancers = data.map((dancer) => ({
      id: dancer.id,
      location: dancer.location,
      gpa: dancer.gpa,
      gradYear: dancer.gradYear,
      createdAt: dancer.createdAt,
      user: {
        id: dancer.userId,
        username: dancer.username,
        email: dancer.displayEmail,
        name: `${dancer.firstName} ${dancer.lastName}`,
        avatar: imageUrl(dancer.avatar, "avatar"),
        verified: dancer.verified,
        role: dancer.role,
      },
    }));

    const page = params.page ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      dancers,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages - 1,
        hasPreviousPage: page > 0,
      },
    };
  }
}
