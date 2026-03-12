import { outbox } from "#database/schema/notifications";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { count, desc } from "drizzle-orm";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    const results = await this.db.use((db) =>
      db
        .select({
          type: outbox.type,
          count: count(),
        })
        .from(outbox)
        .groupBy(outbox.type)
        .orderBy(desc(count()))
    );

    return Object.fromEntries(results.map((r) => [r.type, r.count])) as Record<
      string,
      number
    >;
  }
}
