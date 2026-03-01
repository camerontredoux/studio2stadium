import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(schoolId: string) {
    return this.db.use((db) =>
      db.query.schoolApplications.findFirst({
        where: { schoolId },
      })
    );
  }
}
