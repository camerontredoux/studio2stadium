import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import DeleteFeedbackEmail from "./email.ts";
import GoodbyeEmail from "./goodbye-email.ts";

interface DeleteAccountEventData {
  userId: string;
  userEmail: string;
  userName: string;
  feedback?: string;
  isAdmin?: boolean;
}

export class DeleteAccountEvent extends BaseEvent {
  constructor(public data: DeleteAccountEventData) {
    super();
  }
}

class DeleteAccountHandler {
  async handle(event: DeleteAccountEvent) {
    if (event.data.isAdmin) return;

    const { userEmail, userName } = event.data;

    await Promise.all([
      mail.send(new DeleteFeedbackEmail(event.data)),
      mail.send(new GoodbyeEmail({ email: userEmail, firstName: userName })),
    ]);
  }
}

emitter.listen(DeleteAccountEvent, [DeleteAccountHandler]);
