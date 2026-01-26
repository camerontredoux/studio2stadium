import { inject } from "@adonisjs/core";
import { getAccountByUsername } from "./queries.ts";
import { GetUsernameAvailableValidator } from "./validator.ts";

@inject()
export class GetUsernameAvailableService {
  async execute({ username }: GetUsernameAvailableValidator): Promise<boolean> {
    const user = await getAccountByUsername(username);

    return user === undefined;
  }
}
