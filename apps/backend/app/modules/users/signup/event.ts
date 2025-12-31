import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import { type SignupQueries } from "./queries.ts";

const VerificationListener = () =>
  import("#modules/notifications/verification/listener");

export default class SignupEvent extends BaseEvent {
  constructor(public user: Awaited<ReturnType<SignupQueries["createUser"]>>) {
    super();
  }
}

emitter.listen(SignupEvent, [VerificationListener, VerificationListener]);
