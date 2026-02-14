import { db } from "#database/connection";
import { posts } from "#database/schema/index";

// type School = {
//   id: string;
//   username: string;
//   email: string;
//   role: (typeof users.role.enumValues)[number];
//   type: (typeof users.type.enumValues)[number];
//   displayEmail: string;
//   firstName: string;
//   lastName: string;
//   password: string;
//   salt: string;
//   avatar: string;
//   phone: string | null;
//   createdAt: string;
//   verified: boolean;
//   notifications: boolean;
//   school: {
//     id: string;
//     userId: string;
//     name: string;
//     location: string;
//     division: string;
//     benefits: string;
//     about: string;
//     website: string;
//     timeCommitment: string;
//     headCoach: string;
//     assistantCoach: string;
//     tiktok: string;
//     instagram: string;
//     missionStatement: string;
//     whatWeDo: string;
//     competitions: string[];
//     sports: string[];
//     gpaRequirement: number;
//     schoolSize: number;
//     createdAt: string;
//     skills: {
//       schoolId: string;
//       skillId: string;
//       weight: number;
//       createdAt: string;
//     }[];
//     events: {
//       id: string;
//       title: string;
//       description: string;
//       location: string;
//       link: string | null;
//       type: string;
//       start: string;
//       end: string | null;
//       startTime: string;
//       endTime: string;
//       createdAt: string;
//       updatedAt: string;
//       schoolId: string;
//     }[];
//   };
// };

// async function main() {
//   for (const data of usersData) {
//     const { school, ...user } = data as School;

//     const { skills, events, ...schoolData } = school;

//     // await db.insert(users).values(user);

//     // await db.insert(schoolProfiles).values(schoolData);

//     if (events.length > 0) {
//       await db.insert(danceEvents).values(events);
//     }
//   }
// }

import postsj from "./posts.json" with { type: "json" };

async function main() {
  // await db.insert(library).values(lib);
  for (const post of postsj) {
    const created_at = new Date(post.created_at);
    const updated_at = new Date(post.updated_at);
    await db.insert(posts).values({
      ...post,
      createdAt: created_at,
      updatedAt: updated_at,
    });
  }
}

main()
  .catch(console.error)
  .finally(() => db.$client.end());
