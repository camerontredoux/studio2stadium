import { type Insertable } from "kysely";
import { type User } from "../../../database/generated/types.ts";
import BaseQuery from "../../../utils/base-query.ts";

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
