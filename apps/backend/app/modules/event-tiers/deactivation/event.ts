import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import mail from "@adonisjs/mail/services/main";
import PurchaseDeactivatedEmail, {
  type PurchaseDeactivatedEmailData,
} from "./email.ts";

/** A refund or dispute stood a paid Org Event down (ADR 0005). */
export class PurchaseDeactivatedEvent extends BaseEvent {
  constructor(public data: PurchaseDeactivatedEmailData) {
    super();
  }
}

class PurchaseDeactivatedHandler {
  async handle(event: PurchaseDeactivatedEvent) {
    await mail.send(new PurchaseDeactivatedEmail(event.data));
  }
}

emitter.listen(PurchaseDeactivatedEvent, [PurchaseDeactivatedHandler]);
