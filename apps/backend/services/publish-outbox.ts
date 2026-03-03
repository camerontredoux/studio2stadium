import { db } from "#database/connection";
import { outbox } from "#database/schema/notifications";
import env from "#start/env";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { inArray, isNull } from "drizzle-orm";

const sqs = new SQSClient({
  region: env.get("AWS_REGION"),
  credentials: {
    accessKeyId: env.get("SQS_ACCESS_KEY_ID"),
    secretAccessKey: env.get("SQS_SECRET_ACCESS_KEY"),
  },
});

const QUEUE_URL = env.get("SQS_QUEUE_URL");
const BATCH_SIZE = 10; // SQS max batch size

export default class PublishOutboxService {
  async run() {
    const unpublished = await db
      .select({ id: outbox.id, type: outbox.type })
      .from(outbox)
      .where(isNull(outbox.publishedAt))
      .limit(100);

    if (unpublished.length === 0) {
      return;
    }

    console.log(`[Outbox]: Publishing ${unpublished.length} events to SQS`);

    // Process in batches of 10 (SQS limit)
    for (let i = 0; i < unpublished.length; i += BATCH_SIZE) {
      const batch = unpublished.slice(i, i + BATCH_SIZE);

      const command = new SendMessageBatchCommand({
        QueueUrl: QUEUE_URL,
        Entries: batch.map((event) => ({
          Id: event.id,
          MessageBody: JSON.stringify({
            eventId: event.id,
            eventType: event.type,
          }),
        })),
      });

      const result = await sqs.send(command);

      if (result.Failed && result.Failed.length > 0) {
        console.error("[Outbox]: Failed to send some messages:", result.Failed);
      }

      // Mark successfully sent as published
      const successIds =
        result.Successful?.map((s) => s.Id).filter((id): id is string =>
          Boolean(id)
        ) ?? [];

      if (successIds.length > 0) {
        await db
          .update(outbox)
          .set({ publishedAt: new Date() })
          .where(inArray(outbox.id, successIds));
      }
    }
  }
}
