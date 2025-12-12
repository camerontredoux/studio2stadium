import BaseQuery from "#shared/base-query";

export class LoginQueries extends BaseQuery {
  async findUserByEmail(email: string) {
    return await this.use((db) =>
      db.selectFrom("users").selectAll().where("email", "=", email).executeTakeFirst()
    );
  }

  async updateLoginTime(email: string) {
    await this.use((db) =>
      db
        .updateTable("users")
        .set({ last_logged_in: new Date() })
        .where("email", "=", email)
        .execute()
    );
  }
}
