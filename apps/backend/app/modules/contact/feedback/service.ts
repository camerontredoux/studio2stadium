import { inject } from "@adonisjs/core";
import { FeedbackEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  async execute(
    data: Validator,
    user: { id: string; displayEmail: string; firstName: string }
  ) {
    FeedbackEvent.dispatch({
      ...data,
      userId: user.id,
      userEmail: user.displayEmail,
      userName: user.firstName,
    });
  }
}
