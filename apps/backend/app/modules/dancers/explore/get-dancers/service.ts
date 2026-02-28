import { dancerProfiles } from "#database/schema/dancers";
import { favorites } from "#database/schema/profiles";
import { dancerSports } from "#database/schema/sports";
import { dancerStyles } from "#database/schema/styles";
import { subscriptions } from "#database/schema/subscriptions";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";
import { and, asc, eq, exists, gte, lte, sql } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(filters: Validator, override: boolean, userId: string) {
    const limit = filters.limit ?? 10;
    const offset = filters.page ? filters.page * limit : 0;

    const conditions = this.buildConditions(filters, override, userId);

    const [data, countResult] = await Promise.all([
      this.db.use((db) =>
        db
          .select({
            id: dancerProfiles.id,
            location: dancerProfiles.location,
            gpa: dancerProfiles.gpa,
            gradYear: dancerProfiles.gradYear,
            birthday: dancerProfiles.birthday,
            createdAt: dancerProfiles.createdAt,
            username: users.username,
            avatar: users.avatar,
            firstName: users.firstName,
            lastName: users.lastName,
            subscribed: sql<boolean>`${subscriptions.id} IS NOT NULL`,
            followers: sql<number>`(
              SELECT COUNT(*)::int FROM school_favorites
              WHERE school_favorites.dancer_id = ${dancerProfiles.id}
            )`,
          })
          .from(dancerProfiles)
          .innerJoin(users, eq(dancerProfiles.userId, users.id))
          .leftJoin(
            subscriptions,
            and(
              eq(subscriptions.userId, users.id),
              eq(subscriptions.status, "active")
            )
          )
          .where(and(...conditions))
          .orderBy(asc(users.firstName))
          .limit(limit)
          .offset(offset)
      ),
      this.db.use((db) =>
        db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(dancerProfiles)
          .innerJoin(users, eq(dancerProfiles.userId, users.id))
          .leftJoin(
            subscriptions,
            and(
              eq(subscriptions.userId, users.id),
              eq(subscriptions.status, "active")
            )
          )
          .where(and(...conditions))
      ),
    ]);

    const total = countResult[0]?.count ?? 0;

    const dancers = data.map((dancer) => ({
      id: dancer.id,
      location: dancer.location,
      gpa: dancer.gpa,
      gradYear: dancer.gradYear,
      birthday: dancer.birthday,
      createdAt: dancer.createdAt,
      username: dancer.username,
      avatar: imageUrl(dancer.avatar, {
        fit: "cover",
        width: 320,
        height: 320,
      }),
      name: `${dancer.firstName} ${dancer.lastName}`,
      subscribed: dancer.subscribed,
      followers: dancer.followers,
    }));

    const page = filters.page ?? 0;
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

  private buildConditions(
    filters: Validator,
    override: boolean,
    userId: string
  ) {
    const conditions = [];

    if (!override) {
      conditions.push(eq(users.role, "user"));
    }

    if (filters.premium) {
      conditions.push(sql`${subscriptions.id} IS NOT NULL`);
    }

    if (filters.name) {
      const pattern = `%${filters.name}%`;
      conditions.push(
        sql`CONCAT(${users.firstName}, ' ', ${users.lastName}) ILIKE ${pattern}`
      );
    }

    if (filters.location) {
      conditions.push(eq(dancerProfiles.location, filters.location));
    }

    if (filters.gpaRange) {
      if (filters.gpaRange.min !== undefined) {
        conditions.push(gte(dancerProfiles.gpa, filters.gpaRange.min));
      }
      if (filters.gpaRange.max !== undefined) {
        conditions.push(lte(dancerProfiles.gpa, filters.gpaRange.max));
      }
    }

    if (filters.sports?.length) {
      conditions.push(
        exists(
          sql`(
            SELECT 1 FROM ${dancerSports}
            WHERE ${dancerSports.dancerId} = ${dancerProfiles.id}
            AND ${dancerSports.sportId} IN (${sql.join(
              filters.sports.map((s) => sql`${s}`),
              sql`, `
            )})
          )`
        )
      );
    }

    if (filters.styles?.length) {
      conditions.push(
        exists(
          sql`(
            SELECT 1 FROM ${dancerStyles}
            WHERE ${dancerStyles.dancerId} = ${dancerProfiles.id}
            AND ${dancerStyles.styleId} IN (${sql.join(
              filters.styles.map((s) => sql`${s}`),
              sql`, `
            )})
          )`
        )
      );
    }

    if (filters.following) {
      conditions.push(
        exists(
          sql`(
            SELECT 1 FROM ${favorites}
            WHERE ${favorites.dancerId} = ${dancerProfiles.id}
            AND ${favorites.schoolId} IN (
              SELECT id FROM school_profiles WHERE user_id = ${userId}
            )
          )`
        )
      );
    }

    return conditions;
  }
}
