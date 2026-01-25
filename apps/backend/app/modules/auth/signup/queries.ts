import { type User } from "#database/generated/types";
import BaseQuery from "#utils/base-query";
import { type Insertable } from "kysely";

export class SignupQueries extends BaseQuery {
  async createUser(data: Insertable<User>) {
    return await this.use((db) =>
      db
        .insertInto("users")
        .values(data)
        .returning([
          "id",
          "email",
          "display_email as displayEmail",
          "username",
          "first_name as firstName",
          "last_name as lastName",
          "avatar",
          "role",
        ])
        .executeTakeFirstOrThrow()
    );
  }
}
