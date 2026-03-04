import { outbox } from "#database/schema/notifications";
import { db } from "./connection.ts";

// Discriminated union for all outbox types
export type OutboxEntry =
  // Auth
  | { type: "user.signup"; payload: { userId: string } }
  // Dancer engagement
  | { type: "school.interest"; payload: { dancerId: string; schoolId: string } }
  | {
      type: "dancer.favorite";
      payload: {
        schoolId: string;
        dancerId: string;
        platform: "core" | "prodigy";
      };
    }
  | { type: "school.followed"; payload: { dancerId: string; schoolId: string } }
  // Recruiting
  | {
      type: "crv.submission";
      payload: { dancerId: string; schoolId: string; videoId: string };
    }
  | {
      type: "dancer.profile-viewed";
      payload: { dancerId: string; schoolId: string };
    }
  | {
      type: "dancer.prospect-status";
      payload: { dancerId: string; schoolId: string; status: string };
    }
  // Dancer profile updates
  | { type: "dancer.image-uploaded"; payload: { dancerId: string } }
  | { type: "dancer.video-uploaded"; payload: { dancerId: string } }
  | { type: "dancer.reference-added"; payload: { dancerId: string } }
  | { type: "dancer.achievement-added"; payload: { dancerId: string } }
  // School content
  | {
      type: "school.event-created";
      payload: { schoolId: string; eventId: string };
    }
  | { type: "school.image-uploaded"; payload: { schoolId: string } }
  | { type: "school.video-uploaded"; payload: { schoolId: string } }
  // Event attendance
  | { type: "event.attended"; payload: { userId: string; eventId: string } }
  // Admin
  | { type: "school.approved"; payload: { schoolId: string } }
  // Video processing
  | { type: "video.ready"; payload: { userId: string; videoId: string } }
  | {
      type: "video.failed";
      payload: { userId: string; errorMessage: string };
    };

export class OutboxService {
  async publish(entry: OutboxEntry): Promise<void> {
    await db.insert(outbox).values({
      type: entry.type,
      payload: entry.payload,
    });
  }
}

export const outboxService = new OutboxService();
