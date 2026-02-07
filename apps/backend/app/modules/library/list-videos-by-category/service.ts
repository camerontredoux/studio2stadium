import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params: { category }, page }: Validator) {
    const limit = 6;
    const offset = (page - 1) * limit;

    return this.db.use((db) =>
      db.query.library.findMany({
        where: {
          category,
        },
        orderBy: {
          createdAt: "desc",
        },
        limit,
        offset,
      })
    );
  }
}
