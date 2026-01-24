import { db } from "#database/connection";

async function main() {
  await db
    .insertInto("platforms")
    .values([{ name: "core" }, { name: "prodigy" }])
    .execute();
}

main()
  .catch(console.error)
  .finally(() => db.destroy());
