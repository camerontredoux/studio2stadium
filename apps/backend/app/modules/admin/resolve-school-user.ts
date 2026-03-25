import { type DatabaseService } from "#database/service";
import cache from "@adonisjs/cache/services/main";

export type ResolvedSchoolUser = {
  userId: string;
  profileId: string;
  username: string;
  avatar: string | null;
};

export async function resolveSchoolUserByUsername(
  db: DatabaseService,
  username: string
): Promise<
  { ok: true; school: ResolvedSchoolUser } | { ok: false; error: string }
> {
  const user = await db.use((d) =>
    d.query.users.findFirst({
      where: { username },
      columns: { id: true, username: true, avatar: true },
      with: {
        schoolProfile: { columns: { id: true } },
      },
    })
  );

  if (!user?.schoolProfile) {
    return { ok: false, error: "School not found" };
  }

  return {
    ok: true,
    school: {
      userId: user.id,
      profileId: user.schoolProfile.id,
      username: user.username,
      avatar: user.avatar,
    },
  };
}

export async function invalidateSchoolProfileCache(username: string) {
  await cache.delete({ key: `schools:profile:${username}` });
}
