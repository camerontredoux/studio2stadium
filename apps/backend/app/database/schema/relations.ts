import { defineRelations } from "drizzle-orm";

import * as schema from "./index.ts";

export const relations = defineRelations(schema, (r) => ({
  users: {
    dancerProfile: r.one.dancerProfiles({
      from: r.users.id,
      to: r.dancerProfiles.userId,
    }),
    schoolProfile: r.one.schoolProfiles({
      from: r.users.id,
      to: r.schoolProfiles.userId,
    }),
    subscription: r.one.subscriptions({
      from: r.users.id,
      to: r.subscriptions.userId,
    }),
    platforms: r.many.platforms({
      from: r.users.id,
      to: r.platforms.userId,
    }),
  },
  dancerProfiles: {
    user: r.one.users({
      from: r.dancerProfiles.userId,
      to: r.users.id,
    }),
    media: r.many.dancerMedia({
      from: r.dancerProfiles.id,
      to: r.dancerMedia.dancerId,
    }),
    achievements: r.many.achievements({
      from: r.dancerProfiles.id,
      to: r.achievements.profileId,
    }),
    references: r.many.references({
      from: r.dancerProfiles.id,
      to: r.references.profileId,
    }),
    styles: r.many.styles({
      from: r.dancerProfiles.id.through(r.dancersToStyles.dancerId),
      to: r.styles.id.through(r.dancersToStyles.styleId),
    }),
    skills: r.many.skills({
      from: r.dancerProfiles.id.through(r.dancersToSkills.dancerId),
      to: r.skills.id.through(r.dancersToSkills.skillId),
    }),
    submissions: r.many.crvSubmissions({
      from: r.dancerProfiles.id,
      to: r.crvSubmissions.dancerId,
    }),
    interests: r.many.schoolProfiles({
      from: r.dancerProfiles.id.through(r.interests.dancerId),
      to: r.schoolProfiles.id.through(r.interests.schoolId),
    }),
  },
  schoolProfiles: {
    user: r.one.users({
      from: r.schoolProfiles.userId,
      to: r.users.id,
    }),
    media: r.many.schoolMedia({
      from: r.schoolProfiles.id,
      to: r.schoolMedia.schoolId,
    }),
    styles: r.many.styles({
      from: r.schoolProfiles.id.through(r.schoolsToStyles.schoolId),
      to: r.styles.id.through(r.schoolsToStyles.styleId),
    }),
    skills: r.many.skills({
      from: r.schoolProfiles.id.through(r.schoolsToSkills.schoolId),
      to: r.skills.id.through(r.schoolsToSkills.skillId),
    }),
    events: r.many.danceEvents({
      from: r.schoolProfiles.id,
      to: r.danceEvents.schoolId,
    }),
    interested: r.many.dancerProfiles({
      from: r.schoolProfiles.id.through(r.interests.schoolId),
      to: r.dancerProfiles.id.through(r.interests.dancerId),
    }),
    submissions: r.many.crvSubmissions({
      from: r.schoolProfiles.id,
      to: r.crvSubmissions.schoolId,
    }),
  },
  danceEvents: {
    organizer: r.one.schoolProfiles({
      from: r.danceEvents.schoolId,
      to: r.schoolProfiles.id,
    }),
    attendees: r.many.users({
      from: r.danceEvents.id.through(r.danceEventAttendees.eventId),
      to: r.users.id.through(r.danceEventAttendees.userId),
    }),
    schedule: r.one.danceEventSchedules({
      from: r.danceEvents.id,
      to: r.danceEventSchedules.eventId,
    }),
  },
  dancerFeed: {
    dancer: r.one.dancerProfiles({
      from: r.dancerFeed.dancerId,
      to: r.dancerProfiles.id,
    }),
  },
  schoolFeed: {
    school: r.one.schoolProfiles({
      from: r.schoolFeed.schoolId,
      to: r.schoolProfiles.id,
    }),
  },
  notifications: {
    user: r.one.users({
      from: r.notifications.userId,
      to: r.users.id,
    }),
  },
  userActivities: {
    user: r.one.users({
      from: r.userActivities.userId,
      to: r.users.id,
    }),
  },
}));
