import { crvSubmissions, crvVideos } from "#database/schema/crv";
import { DatabaseService } from "#database/service";
import { E_FORBIDDEN } from "#exceptions/forbidden";
import { graduatingClass } from "#shared/prospect-emails/cutoff";
import { inject } from "@adonisjs/core";
import { CrvSubmissionEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, data: Validator) {
    const dancer = await this.db.use((db) =>
      db.query.dancerProfiles.findFirst({
        where: { id: profileId },
        columns: { gradYear: true },
      })
    );

    // Open to this cycle's graduating seniors and older (lower grad year ==
    // older).
    if (
      !dancer ||
      dancer.gradYear === null ||
      dancer.gradYear > graduatingClass(new Date())
    ) {
      throw new E_FORBIDDEN(
        "Only graduating seniors and older can submit a common recruiting video"
      );
    }

    await this.db.tx(async (tx) => {
      await tx
        .insert(crvVideos)
        .values({
          dancerId: profileId,
          youtubeId: data.videoId,
        })
        .onConflictDoUpdate({
          target: crvVideos.dancerId,
          set: {
            youtubeId: data.videoId,
          },
        });

      await tx.insert(crvSubmissions).values(
        data.schoolId.map((schoolId) => ({
          dancerId: profileId,
          schoolId,
          videoId: data.videoId,
        }))
      );
    });

    // Dispatch event for each school
    for (const schoolId of data.schoolId) {
      CrvSubmissionEvent.dispatch({
        dancerId: profileId,
        schoolId,
        videoId: data.videoId,
      });
    }
  }
}
