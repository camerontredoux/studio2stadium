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
    images: r.many.images({
      from: r.users.id,
      to: r.images.userId,
    }),
    videos: r.many.videos({
      from: r.users.id,
      to: r.videos.userId,
    }),
    videoUploads: r.many.videoUploads({
      from: r.users.id,
      to: r.videoUploads.userId,
    }),
    events: r.many.danceEvents({
      from: r.users.id.through(r.danceEventAttendees.userId),
      to: r.danceEvents.id.through(r.danceEventAttendees.eventId),
    }),
    globalEvents: r.many.globalDanceEvents({
      from: r.users.id.through(r.globalDanceEventAttendees.userId),
      to: r.globalDanceEvents.id.through(r.globalDanceEventAttendees.eventId),
    }),
  },
  dancerProfiles: {
    user: r.one.users({
      from: r.dancerProfiles.userId,
      to: r.users.id,
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
      from: r.dancerProfiles.id.through(r.dancerStyles.dancerId),
      to: r.styles.slug.through(r.dancerStyles.styleId),
    }),
    skills: r.many.skills({
      from: r.dancerProfiles.id.through(r.dancerSkills.dancerId),
      to: r.skills.slug.through(r.dancerSkills.skillId),
    }),
    submissions: r.many.crvSubmissions({
      from: r.dancerProfiles.id,
      to: r.crvSubmissions.dancerId,
    }),
    interests: r.many.schoolProfiles({
      from: r.dancerProfiles.id.through(r.interests.dancerId),
      to: r.schoolProfiles.id.through(r.interests.schoolId),
    }),
    sports: r.many.sports({
      from: r.dancerProfiles.id.through(r.dancerSports.dancerId),
      to: r.sports.slug.through(r.dancerSports.sportId),
    }),
    following: r.many.schoolProfiles({
      from: r.dancerProfiles.id.through(r.follows.dancerId),
      to: r.schoolProfiles.id.through(r.follows.schoolId),
    }),
    followers: r.many.schoolProfiles({
      from: r.dancerProfiles.id.through(r.favorites.dancerId),
      to: r.schoolProfiles.id.through(r.favorites.schoolId),
    }),
    submission: r.one.crvVideos({
      from: r.dancerProfiles.id,
      to: r.crvVideos.dancerId,
    }),
  },
  schoolProfiles: {
    user: r.one.users({
      from: r.schoolProfiles.userId,
      to: r.users.id,
    }),
    styles: r.many.styles({
      from: r.schoolProfiles.id.through(r.schoolStyles.schoolId),
      to: r.styles.slug.through(r.schoolStyles.styleId),
    }),
    skills: r.many.skills({
      from: r.schoolProfiles.id.through(r.schoolSkills.schoolId),
      to: r.skills.slug.through(r.schoolSkills.skillId),
    }),
    schoolSkills: r.many.schoolSkills({
      from: r.schoolProfiles.id,
      to: r.schoolSkills.schoolId,
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
    sports: r.many.sports({
      from: r.schoolProfiles.id.through(r.schoolSports.schoolId),
      to: r.sports.slug.through(r.schoolSports.sportId),
    }),
    followers: r.many.dancerProfiles({
      from: r.schoolProfiles.id.through(r.follows.schoolId),
      to: r.dancerProfiles.id.through(r.follows.dancerId),
    }),
    favorites: r.many.dancerProfiles({
      from: r.schoolProfiles.id.through(r.favorites.schoolId),
      to: r.dancerProfiles.id.through(r.favorites.dancerId),
    }),
    application: r.one.schoolApplications({
      from: r.schoolProfiles.id,
      to: r.schoolApplications.schoolId,
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
  globalDanceEvents: {
    attendees: r.many.users({
      from: r.globalDanceEvents.id.through(r.globalDanceEventAttendees.eventId),
      to: r.users.id.through(r.globalDanceEventAttendees.userId),
    }),
  },
  feed: {
    user: r.one.users({
      from: r.feed.userId,
      to: r.users.id,
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
  follows: {
    school: r.one.schoolProfiles({
      from: r.follows.schoolId,
      to: r.schoolProfiles.id,
    }),
    dancer: r.one.dancerProfiles({
      from: r.follows.dancerId,
      to: r.dancerProfiles.id,
    }),
  },
  favorites: {
    school: r.one.schoolProfiles({
      from: r.favorites.schoolId,
      to: r.schoolProfiles.id,
    }),
    dancer: r.one.dancerProfiles({
      from: r.favorites.dancerId,
      to: r.dancerProfiles.id,
    }),
  },
  crvSubmissions: {
    dancer: r.one.dancerProfiles({
      from: r.crvSubmissions.dancerId,
      to: r.dancerProfiles.id,
    }),
    school: r.one.schoolProfiles({
      from: r.crvSubmissions.schoolId,
      to: r.schoolProfiles.id,
    }),
  },
  schoolApplications: {
    school: r.one.schoolProfiles({
      from: r.schoolApplications.schoolId,
      to: r.schoolProfiles.id,
    }),
  },
}));
