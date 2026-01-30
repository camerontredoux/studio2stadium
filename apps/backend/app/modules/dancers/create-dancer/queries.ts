import BaseQuery from "#utils/base-query";
import { type CreateDancerValidator } from "./validator.ts";

export class CreateDancerQueries extends BaseQuery {
  async createDancer(userId: string, data: CreateDancerValidator) {
    return await this.transaction(async (db) => {
      if (data.phoneNumber) {
        await db
          .updateTable("users")
          .where("id", "=", userId)
          .set({
            phone: data.phoneNumber,
          })
          .execute();
      }

      const account = await db
        .insertInto("dancer_accounts")
        .values({
          user_id: userId,
          birthday: data.birthday,
          location: data.location,
        })
        .returning(["id"])
        .executeTakeFirstOrThrow();

      console.log(account);

      await db
        .insertInto("dancer_platforms")
        .values({
          platform_name: data.platform,
          account_id: account.id,
        })
        .execute();
    });
  }
}
