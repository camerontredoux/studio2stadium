import { outboxService } from "#database/outbox-service";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import { type Service } from "./service.ts";

export class SignupEvent extends BaseEvent {
  constructor(public user: Awaited<ReturnType<Service["createUser"]>>) {
    super();
  }
}

class SignupHandler {
  async handle(event: SignupEvent) {
    const { user } = event;

    await Promise.all([
      // mail.send(new VerificationEmail(event)),
      outboxService.publish({
        type: "user.signup",
        payload: { userId: user.id },
      }),
    ]);
  }
}

emitter.listen(SignupEvent, [SignupHandler]);
