import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import ForgotPasswordEmail from "./email.ts";

interface ForgotPasswordEventData {
  email: string;
  resetUrl: string;
  isAdmin?: boolean;
}

export class ForgotPasswordEvent extends BaseEvent {
  constructor(public data: ForgotPasswordEventData) {
    super();
  }
}

class ForgotPasswordHandler {
  async handle(event: ForgotPasswordEvent) {
    if (event.data.isAdmin) return;
    await mail.send(new ForgotPasswordEmail(event.data));
  }
}

emitter.listen(ForgotPasswordEvent, [ForgotPasswordHandler]);
