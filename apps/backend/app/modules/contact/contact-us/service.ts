import { inject } from "@adonisjs/core";
import { ContactUsEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  async execute(data: Validator) {
    ContactUsEvent.dispatch(data);
  }
}
