import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import FeedbackEmail from "./email.ts";

interface FeedbackEventData {
  type: "bug" | "feature" | "improvement" | "other";
  message: string;
  page?: string;
  userId: string;
  userEmail: string;
  userName: string;
}

export class FeedbackEvent extends BaseEvent {
  constructor(public data: FeedbackEventData) {
    super();
  }
}

class FeedbackHandler {
  async handle(event: FeedbackEvent) {
    await mail.send(new FeedbackEmail(event.data));
  }
}

emitter.listen(FeedbackEvent, [FeedbackHandler]);
