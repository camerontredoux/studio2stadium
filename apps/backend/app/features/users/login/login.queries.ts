import BaseQuery from "#shared/base-query";

export class LoginQueries extends BaseQuery {
  async findUserByEmail(email: string) {
    return await this.use((db) =>
      db.selectFrom("users").selectAll().where("email", "=", email).executeTakeFirst()
    );
  }
}
