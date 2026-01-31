import { prisma } from "#database/connection";

export function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: {
      username,
      dancer_account: {
        platforms: {
          some: {
            platform_name: "core",
          },
        },
      },
    },
    select: {
      id: true,
      username: true,
      avatar: true,
      dancer_account: {
        select: {
          birthday: true,
          location: true,
          skill_level: true,
          team_level: true,
          high_school: true,
          studio: true,
          gpa: true,
          grad_year: true,
          training_hours: true,
          platforms: {
            select: {
              platform_name: true,
            },
          },
          skills: true,
          styles: true,
          references: true,
          achievements: true,
        },
      },
    },
  });
}
