import { db } from "#database/connection";
import { imageUrl } from "#utils/image-url";

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
    },
  });

  if (!session) return null;

  const { platforms, avatar, ...user } = session;

  let profileId: string | undefined;
  let applied = false;

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
      with: {
        application: {
          columns: {
            id: true,
          },
        },
      },
    });

    if (profile) {
      profileId = profile.id;
      if (profile.application?.id) {
        applied = true;
      }
    }
  }

  return {
    ...user,
    profileId,
    avatar: imageUrl(avatar, "avatar"),
    applied,
    platforms: platforms.map((platform) => platform.platformName),
  };
}
