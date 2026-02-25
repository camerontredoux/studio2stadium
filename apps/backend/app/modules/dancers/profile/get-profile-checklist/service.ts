import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string) {
    const checklist = await this.db.use((db) =>
      db.query.dancerProfiles.findFirst({
        where: { id: profileId },
        columns: {
          gpa: true,
          location: true,
        },
        with: {
          skills: {
            columns: {
              slug: true,
            },
          },
          styles: {
            columns: {
              slug: true,
            },
          },
          sports: {
            columns: {
              slug: true,
            },
          },
        },
      })
    );

    if (!checklist) return null;

    return {
      gpa: !!checklist.gpa,
      location: !!checklist.location,
      skills: checklist?.skills.length >= 10,
      styles: checklist?.styles.length >= 1,
      sports: checklist?.sports.length >= 1,
    };
  }
}
