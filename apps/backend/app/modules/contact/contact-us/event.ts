import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import ContactUsEmail from "./email.ts";

interface ContactUsEventData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export class ContactUsEvent extends BaseEvent {
  constructor(public data: ContactUsEventData) {
    super();
  }
}

class ContactUsHandler {
  async handle(event: ContactUsEvent) {
    await mail.send(new ContactUsEmail(event.data));
  }
}

emitter.listen(ContactUsEvent, [ContactUsHandler]);
