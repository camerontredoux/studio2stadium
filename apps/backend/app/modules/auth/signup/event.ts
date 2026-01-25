import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import { type SignupQueries } from "./queries.ts";
export class SignupEvent extends BaseEvent {
  constructor(public user: Awaited<ReturnType<SignupQueries["createUser"]>>) {
    super();
  }
}

class VerificationListener {
  async handle(event: SignupEvent) {
    console.log(event.user.email);
    // await mail.send(new VerifyEmailNotification(user));
    // create the system event here
  }
}

emitter.listen(SignupEvent, [VerificationListener]);
