import { db } from "#database/connection";
import { danceEvents } from "#database/schema/events";
import { users } from "#database/schema/users";

import usersData from "./users.json" with { type: "json" };
import lib from "./library.json" with { type: "json" };
import { library } from "#database/schema/global";

type School = {
  id: string;
  username: string;
  email: string;
  role: (typeof users.role.enumValues)[number];
  type: (typeof users.type.enumValues)[number];
  displayEmail: string;
  firstName: string;
  lastName: string;
  password: string;
  salt: string;
  avatar: string;
  phone: string | null;
  createdAt: string;
  verified: boolean;
  notifications: boolean;
  school: {
    id: string;
    userId: string;
    name: string;
    location: string;
    division: string;
    benefits: string;
    about: string;
    website: string;
    timeCommitment: string;
    headCoach: string;
    assistantCoach: string;
    tiktok: string;
    instagram: string;
    missionStatement: string;
    whatWeDo: string;
    competitions: string[];
    sports: string[];
    gpaRequirement: number;
    schoolSize: number;
    createdAt: string;
    skills: {
      schoolId: string;
      skillId: string;
      weight: number;
      createdAt: string;
    }[];
    events: {
      id: string;
      title: string;
      description: string;
      location: string;
      link: string | null;
      type: string;
      start: string;
      end: string | null;
      startTime: string;
      endTime: string;
      createdAt: string;
      updatedAt: string;
      schoolId: string;
    }[];
  };
};

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

async function main() {
  await db.insert(library).values(lib);
}

main()
  .catch(console.error)
  .finally(() => db.$client.end());
