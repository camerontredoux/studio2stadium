import { CreateUserDto } from "#repositories/user/user.dto";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";

const VerificationListener = () =>
  import("#features/notifications/verification/verification.listener");

export default class SignupEvent extends BaseEvent {
  constructor(public user: CreateUserDto) {
    super();
  }
}

emitter.on(SignupEvent, [VerificationListener]);
