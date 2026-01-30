import { inject } from "@adonisjs/core";
import { getAccountByUsername } from "./queries.ts";
import { CheckAvailabilityValidator } from "./validator.ts";

@inject()
export class CheckAvailabilityService {
  async execute({ username }: CheckAvailabilityValidator): Promise<boolean> {
    const user = await getAccountByUsername(username);

    return user === undefined;
  }
}
