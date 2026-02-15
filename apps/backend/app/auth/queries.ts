import { db } from "#database/connection";

/**
 * Find user by email for login verification
 */
export async function findUserByEmail(email: string) {
  return await db.query.users.findFirst({
    where: {
      email,
    },
    columns: {
      id: true,
      password: true,
    },
  });
}

/**
 * Get user session by ID for caching after login
 */
export async function getUserSession(id: string) {
  const session = await db.query.users.findFirst({
    where: { id },
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      displayEmail: true,
      username: true,
      avatar: true,
      type: true,
      role: true,
      verified: true,
      notifications: true,
    },
    with: {
      platforms: {
        columns: {
          platformName: true,
        },
      },
      subscription: {
        where: {
          currentPeriodEnd: {
            gt: new Date(),
          },
        },
      },
    },
  });

  if (!session) return null;

  const { subscription, platforms, ...user } = session;

  let profileId: string | undefined;
  if (user.type === "dancer") {
    const profile = await db.query.dancerProfiles.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (profile) {
      profileId = profile.id;
    }
  } else if (user.type === "school") {
    const profile = await db.query.schoolProfiles.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (profile) {
      profileId = profile.id;
    }
  }

  if (!profileId) return null;

  return {
    ...user,
    profileId,
    subscribed: !!subscription,
    platforms: platforms.map((platform) => platform.platformName),
  };
}
