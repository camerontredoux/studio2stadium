import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(schoolId: string) {
    const application = await this.db.use((db) =>
      db.query.schoolApplications.findFirst({
        where: { schoolId },
      })
    );

    return {
      ...application,
      thumbnail: imageUrl(application?.mediaId, "thumbnail"),
    };
  }
}
