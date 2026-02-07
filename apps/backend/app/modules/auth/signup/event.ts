import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import { Service } from "./service.ts";
export class SignupEvent extends BaseEvent {
  constructor(public user: Awaited<ReturnType<Service["createUser"]>>) {
    super();
  }
}

class VerificationListener {
  async handle(event: SignupEvent) {
    console.log(event.user.displayEmail);
    // await mail.send(new VerifyEmailNotification(user));
    // create the system event here
  }
}

emitter.listen(SignupEvent, [VerificationListener]);
