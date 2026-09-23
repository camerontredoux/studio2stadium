import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import OrgReadyEmail, { type OrgReadyEmailData } from "./email.ts";

/** An Event Tier purchase was provisioned; its buyer needs to get in. */
export class OrgReadyEvent extends BaseEvent {
  constructor(public data: OrgReadyEmailData) {
    super();
  }
}

class OrgReadyHandler {
  async handle(event: OrgReadyEvent) {
    await mail.send(new OrgReadyEmail(event.data));
  }
}

emitter.listen(OrgReadyEvent, [OrgReadyHandler]);
