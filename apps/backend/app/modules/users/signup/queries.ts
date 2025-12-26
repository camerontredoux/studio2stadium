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
          "display_email",
          "username",
          "first_name",
          "last_name",
          "avatar",
          "phone",
          "created_at",
          "updated_at",
        ])
        .executeTakeFirstOrThrow()
    );
  }
}
