import { db } from "#database/connection";
import { orgMemberships, organizations } from "#database/schema/organizations";
import { imageUrl } from "#utils/image-url";
import { eq } from "drizzle-orm";

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
      orgAccountTier: true,
      orgAccountTierExpiresAt: true,
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

  const { platforms, avatar, orgAccountTier, orgAccountTierExpiresAt, ...user } = session;

  const tierExpired = orgAccountTierExpiresAt && orgAccountTierExpiresAt < new Date();
  const effectiveTier = tierExpired ? null : orgAccountTier;

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

  const memberships = await db
    .select({
      orgSlug: organizations.slug,
      role: orgMemberships.role,
      type: orgMemberships.type,
    })
    .from(orgMemberships)
    .innerJoin(organizations, eq(organizations.id, orgMemberships.orgId))
    .where(eq(orgMemberships.userId, user.id));

  return {
    ...user,
    profileId,
    avatar: imageUrl(avatar, "avatar"),
    platforms: platforms.map((platform) => platform.platformName),
    orgMemberships: memberships,
    orgAccountTier: effectiveTier,
  };
}
