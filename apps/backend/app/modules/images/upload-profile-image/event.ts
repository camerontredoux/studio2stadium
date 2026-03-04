import { db } from "#database/connection";
import { outboxService } from "#database/outbox-service";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import cache from "@adonisjs/cache/services/main";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import { eq } from "drizzle-orm";

interface ImageUploadEventData {
  profileId: string;
  userType: "dancer" | "school";
}

export class ImageUploadEvent extends BaseEvent {
  constructor(public data: ImageUploadEventData) {
    super();
  }
}

class ImageUploadHandler {
  async handle(event: ImageUploadEvent) {
    const { profileId, userType } = event.data;

    if (userType === "dancer") {
      const [dancer] = await db
        .select({ username: users.username })
        .from(dancerProfiles)
        .innerJoin(users, eq(dancerProfiles.userId, users.id))
        .where(eq(dancerProfiles.id, profileId))
        .limit(1);

      if (dancer) {
        await cache.delete({ key: `dancers:profile:${dancer.username}` });
      }

      await outboxService.publish({
        type: "dancer.image-uploaded",
        payload: { dancerId: profileId },
      });
    } else if (userType === "school") {
      const [school] = await db
        .select({ username: users.username })
        .from(schoolProfiles)
        .innerJoin(users, eq(schoolProfiles.userId, users.id))
        .where(eq(schoolProfiles.id, profileId))
        .limit(1);

      if (school) {
        await cache.delete({ key: `schools:profile:${school.username}` });
      }

      await outboxService.publish({
        type: "school.image-uploaded",
        payload: { schoolId: profileId },
      });
    }
  }
}

emitter.listen(ImageUploadEvent, [ImageUploadHandler]);
