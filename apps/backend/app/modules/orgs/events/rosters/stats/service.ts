import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import type { Validator } from "./validator.ts";

@inject()
export class StatsRosterService {
  // db is wired here now; used in Task 2 when execute() is implemented.
  constructor(private db: DatabaseService = new DatabaseService()) {
    void this.db; // suppress noUnusedLocals until Task 2 implements execute()
  }

  async execute(_eventId: string, _q: Validator): Promise<{
    total: number;
    active: number;
    pending: number;
  }> {
    throw new Error("StatsRosterService.execute not implemented");
  }
}
