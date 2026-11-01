import { db } from "#database/connection";
import { dancerProfiles } from "#database/schema/dancers";
import { dancerSkills, skills } from "#database/schema/skills";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { createDancer } from "#tests/helpers/premium";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
import { Service } from "./service.ts";

test.group("GetProfileChecklistService", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    await db.execute(sql`truncate table ${skills} cascade`);
  });

  test("a GPA of 0 counts as set", async ({ assert }) => {
    const dancer = await createDancer();
    const service = new Service(new DatabaseService());

    assert.isFalse((await service.execute(dancer.profileId))!.gpa);

    await db
      .update(dancerProfiles)
      .set({ gpa: 0 })
      .where(eq(dancerProfiles.id, dancer.profileId));

    assert.isTrue((await service.execute(dancer.profileId))!.gpa);
  });

  test("skills pass at 10 and report the count", async ({ assert }) => {
    const dancer = await createDancer();
    const service = new Service(new DatabaseService());
    const rows = Array.from({ length: 10 }, (_, i) => ({
      slug: `skill-${i}`,
      name: `Skill ${i}`,
      category: "test",
    }));
    await db.insert(skills).values(rows);

    await db.insert(dancerSkills).values(
      rows.slice(0, 9).map((r) => ({
        dancerId: dancer.profileId,
        skillId: r.slug,
      }))
    );
    const nine = (await service.execute(dancer.profileId))!;
    assert.isFalse(nine.skills);
    assert.equal(nine.skillCount, 9);

    await db
      .insert(dancerSkills)
      .values({ dancerId: dancer.profileId, skillId: rows[9]!.slug });
    const ten = (await service.execute(dancer.profileId))!;
    assert.isTrue(ten.skills);
    assert.equal(ten.skillCount, 10);
  });
});
