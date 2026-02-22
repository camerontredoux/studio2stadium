import { db } from "#database/connection";
import { crvSubmissions } from "#database/schema/crv";
import {
  achievements,
  dancerProfiles,
  interests,
  references,
} from "#database/schema/dancers";
import {
  danceEventAttendees,
  danceEvents,
  globalDanceEventAttendees,
  globalDanceEvents,
} from "#database/schema/events";
import { feed } from "#database/schema/feed";
import { library, posts } from "#database/schema/global";
import { images, videos } from "#database/schema/media";
import { notifications } from "#database/schema/notifications";
import { favorites, follows } from "#database/schema/profiles";
import { schoolProfiles } from "#database/schema/schools";
import { dancerSkills, schoolSkills, skills } from "#database/schema/skills";
import { dancerSports, schoolSports, sports } from "#database/schema/sports";
import { dancerStyles, schoolStyles, styles } from "#database/schema/styles";
import { platforms, subscriptions, users } from "#database/schema/users";
import { existsSync, readFileSync } from "node:fs";

// Path to export directory - update this to match your export location
const EXPORT_DIR = "app/database/drizzle/export";

// Type alias for dance event types
type DanceEventType =
  | "audition"
  | "rehearsal"
  | "recital"
  | "showcase"
  | "competition"
  | "class"
  | "intensive"
  | "workshop"
  | "fundraiser"
  | "combine"
  | "convention"
  | "clinic"
  | "deadline"
  | "recruitment"
  | "performance"
  | "camp"
  | "other";

// Helper to read JSON file
function readJson<T>(filename: string): T[] {
  const path = `${EXPORT_DIR}/${filename}`;
  if (!existsSync(path)) {
    console.warn(`  ⚠️ File not found: ${filename}`);
    return [];
  }
  const content = readFileSync(path, "utf-8");
  return JSON.parse(content) as T[];
}

// Helper to convert date strings to Date objects
function toDate(dateStr: string | Date | null | undefined): Date | null {
  if (!dateStr) return null;
  return new Date(dateStr);
}

// Helper to batch insert - fails on first error

async function batchInsert<T extends Record<string, unknown>>(
  table: any,
  data: T[],
  batchSize = 500
): Promise<number> {
  if (data.length === 0) return 0;

  let inserted = 0;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await db.insert(table).values(batch);
    inserted += batch.length;
  }

  return inserted;
}

// ==================== IMPORT FUNCTIONS ====================

async function importUsers() {
  type UserData = {
    id: string;
    username: string;
    email: string;
    role: "admin" | "user" | "prodigy_admin";
    type: "dancer" | "school";
    displayEmail: string;
    firstName: string;
    lastName: string;
    password: string;
    salt: string; // Exported but not in new schema - ignored
    avatar: string | null;
    phone: string | null;
    verified: boolean;
    notifications: boolean;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<UserData>("01_users.json");
  const mapped = data.map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    type: u.type,
    displayEmail: u.displayEmail,
    firstName: u.firstName,
    lastName: u.lastName,
    password: u.password,
    // Note: salt field from export is not in new schema (bcrypt includes salt in hash)
    avatar: u.avatar,
    phone: u.phone,
    verified: u.verified,
    notifications: u.notifications,
    createdAt: toDate(u.createdAt)!,
    updatedAt: toDate(u.updatedAt)!,
  }));

  return batchInsert(users, mapped);
}

async function importUserPlatforms() {
  type PlatformData = {
    userId: string;
    platformName: "core" | "prodigy";
    joinedAt: string;
  };

  const data = readJson<PlatformData>("02_user_platforms.json");
  const mapped = data.map((p) => ({
    userId: p.userId,
    platformName: p.platformName,
    joinedAt: toDate(p.joinedAt)!,
  }));

  return batchInsert(platforms, mapped);
}

async function importDancerProfiles() {
  type ProfileData = {
    id: string;
    userId: string;
    birthday: string;
    location: string;
    biography: string | null;
    awards: string | null;
    instagram: string | null;
    tiktok: string | null;
    youtube: string | null;
    skillLevel: string | null;
    teamLevel: string | null;
    highSchool: string | null;
    studio: string | null;
    gpa: number | null;
    gradYear: number | null;
    trainingHours: number | null;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<ProfileData>("03_dancer_profiles.json");
  const mapped = data.map((p) => ({
    id: p.id,
    userId: p.userId,
    birthday: p.birthday,
    location: p.location,
    biography: p.biography,
    awards: p.awards,
    instagram: p.instagram,
    tiktok: p.tiktok,
    youtube: p.youtube,
    skillLevel: p.skillLevel,
    teamLevel: p.teamLevel,
    highSchool: p.highSchool,
    studio: p.studio,
    gpa: p.gpa,
    gradYear: p.gradYear,
    trainingHours: p.trainingHours,
    createdAt: toDate(p.createdAt)!,
    updatedAt: toDate(p.updatedAt)!,
  }));

  return batchInsert(dancerProfiles, mapped);
}

async function importSchoolProfiles() {
  type ProfileData = {
    id: string;
    userId: string;
    name: string;
    location: string;
    division: string | null;
    benefits: string | null;
    about: string | null;
    website: string | null;
    timeCommitment: string | null;
    headCoach: string | null;
    assistantCoach: string | null;
    missionStatement: string | null;
    whatWeDo: string | null;
    gpa: number | null;
    size: number | null;
    tiktok: string | null;
    instagram: string | null;
    image: string | null; // Exported but not in schema - ignored
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<ProfileData>("04_school_profiles.json");
  const mapped = data.map((p) => ({
    id: p.id,
    userId: p.userId,
    name: p.name,
    location: p.location,
    division: p.division,
    benefits: p.benefits,
    about: p.about,
    website: p.website,
    timeCommitment: p.timeCommitment,
    headCoach: p.headCoach,
    assistantCoach: p.assistantCoach,
    missionStatement: p.missionStatement,
    whatWeDo: p.whatWeDo,
    gpa: p.gpa,
    size: p.size,
    tiktok: p.tiktok,
    instagram: p.instagram,
    // Note: image field from export is not in schema (schools use user.avatar)
    createdAt: toDate(p.createdAt)!,
    updatedAt: toDate(p.updatedAt)!,
  }));

  return batchInsert(schoolProfiles, mapped);
}

async function importSkills() {
  type SkillData = {
    slug: string;
    name: string;
    category: string;
  };

  const data = readJson<SkillData>("05_skills.json");
  return batchInsert(skills, data);
}

async function importSports() {
  type SportData = {
    slug: string;
    name: string;
  };

  const data = readJson<SportData>("06_sports.json");
  return batchInsert(sports, data);
}

async function importStyles() {
  type StyleData = {
    slug: string;
    name: string;
  };

  const data = readJson<StyleData>("07_styles.json");
  return batchInsert(styles, data);
}

async function importAchievements() {
  type AchievementData = {
    id: string;
    profileId: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<AchievementData>("08_achievements.json");
  const mapped = data.map((a) => ({
    id: a.id,
    profileId: a.profileId,
    title: a.title,
    description: a.description,
    createdAt: toDate(a.createdAt)!,
    updatedAt: toDate(a.updatedAt)!,
  }));

  return batchInsert(achievements, mapped);
}

async function importReferences() {
  type ReferenceData = {
    id: string;
    profileId: string;
    name: string;
    title: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<ReferenceData>("09_references.json");
  const mapped = data.map((r) => ({
    id: r.id,
    profileId: r.profileId,
    name: r.name,
    title: r.title,
    description: r.description,
    createdAt: toDate(r.createdAt)!,
    updatedAt: toDate(r.updatedAt)!,
  }));

  return batchInsert(references, mapped);
}

async function importDancerSkills() {
  type DancerSkillData = {
    dancerId: string;
    skillId: string;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<DancerSkillData>("10_dancer_skills.json");
  const mapped = data.map((s) => ({
    dancerId: s.dancerId,
    skillId: s.skillId,
    createdAt: toDate(s.createdAt)!,
    updatedAt: toDate(s.updatedAt)!,
  }));

  return batchInsert(dancerSkills, mapped);
}

async function importSchoolSkills() {
  type SchoolSkillData = {
    schoolId: string;
    skillId: string;
    weight: number | null;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<SchoolSkillData>("11_school_skills.json");
  const mapped = data.map((s) => ({
    schoolId: s.schoolId,
    skillId: s.skillId,
    weight: s.weight,
    createdAt: toDate(s.createdAt)!,
    updatedAt: toDate(s.updatedAt)!,
  }));

  return batchInsert(schoolSkills, mapped);
}

async function importDancerSports() {
  type DancerSportData = {
    dancerId: string;
    sportId: string;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<DancerSportData>("12_dancer_sports.json");
  const mapped = data.map((s) => ({
    dancerId: s.dancerId,
    sportId: s.sportId,
    createdAt: toDate(s.createdAt)!,
    updatedAt: toDate(s.updatedAt)!,
  }));

  return batchInsert(dancerSports, mapped);
}

async function importDancerStyles() {
  type DancerStyleData = {
    dancerId: string;
    styleId: string;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<DancerStyleData>("13_dancer_styles.json");
  const mapped = data.map((s) => ({
    dancerId: s.dancerId,
    styleId: s.styleId,
    createdAt: toDate(s.createdAt)!,
    updatedAt: toDate(s.updatedAt)!,
  }));

  return batchInsert(dancerStyles, mapped);
}

async function importSchoolSports() {
  type SchoolSportData = {
    schoolId: string;
    sportId: string;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<SchoolSportData>("14_school_sports.json");
  const mapped = data.map((s) => ({
    schoolId: s.schoolId,
    sportId: s.sportId,
    createdAt: toDate(s.createdAt)!,
    updatedAt: toDate(s.updatedAt)!,
  }));

  return batchInsert(schoolSports, mapped);
}

async function importSchoolStyles() {
  type SchoolStyleData = {
    schoolId: string;
    styleId: string;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<SchoolStyleData>("15_school_styles.json");
  const mapped = data.map((s) => ({
    schoolId: s.schoolId,
    styleId: s.styleId,
    createdAt: toDate(s.createdAt)!,
    updatedAt: toDate(s.updatedAt)!,
  }));

  return batchInsert(schoolStyles, mapped);
}

async function importProfileVideos() {
  type VideoData = {
    id: string;
    userId: string;
    mediaId: string;
    caption: string | null;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<VideoData>("16_profile_videos.json");
  const mapped = data.map((v) => ({
    id: v.id,
    userId: v.userId,
    mediaId: v.mediaId,
    caption: v.caption,
    createdAt: toDate(v.createdAt)!,
    updatedAt: toDate(v.updatedAt)!,
  }));

  return batchInsert(videos, mapped);
}

async function importProfileImages() {
  type ImageData = {
    id: string;
    userId: string;
    mediaUrl: string;
    caption: string | null;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<ImageData>("17_profile_images.json");
  const mapped = data.map((i) => ({
    id: i.id,
    userId: i.userId,
    mediaUrl: i.mediaUrl,
    caption: i.caption,
    createdAt: toDate(i.createdAt)!,
    updatedAt: toDate(i.updatedAt)!,
  }));

  return batchInsert(images, mapped);
}

async function importDanceEvents() {
  type EventData = {
    id: string;
    schoolId: string;
    title: string;
    description: string;
    location: string;
    address: string | null;
    website: string | null;
    tags: string[] | null;
    cost: string | null;
    type: string;
    startDatetime: string;
    endDatetime: string;
    timezone: string;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<EventData>("18_dance_events.json");
  const mapped = data.map((e) => ({
    id: e.id,
    schoolId: e.schoolId,
    title: e.title,
    description: e.description,
    location: e.location,
    address: e.address,
    website: e.website,
    tags: e.tags,
    cost: e.cost,
    type: e.type as DanceEventType,
    startDatetime: new Date(e.startDatetime),
    endDatetime: new Date(e.endDatetime),
    timezone: e.timezone,
    createdAt: toDate(e.createdAt)!,
    updatedAt: toDate(e.updatedAt)!,
  }));

  return batchInsert(danceEvents, mapped);
}

async function importGlobalDanceEvents() {
  type EventData = {
    id: string;
    title: string;
    thumbnail: string;
    description: string;
    location: string;
    website: string;
    organization: string;
    startDatetime: string;
    endDatetime: string;
    type: string;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<EventData>("19_global_events.json");
  const mapped = data.map((e) => ({
    id: e.id,
    title: e.title,
    thumbnail: e.thumbnail,
    description: e.description,
    location: e.location,
    website: e.website,
    organization: e.organization,
    startDatetime: new Date(e.startDatetime),
    endDatetime: new Date(e.endDatetime),
    type: e.type as DanceEventType,
    createdAt: toDate(e.createdAt)!,
    updatedAt: toDate(e.updatedAt)!,
  }));

  return batchInsert(globalDanceEvents, mapped);
}

async function importEventAttendees() {
  type AttendeeData = {
    eventId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<AttendeeData>("20_event_attendees.json");
  const mapped = data.map((a) => ({
    eventId: a.eventId,
    userId: a.userId,
    createdAt: toDate(a.createdAt)!,
    updatedAt: toDate(a.updatedAt)!,
  }));

  return batchInsert(danceEventAttendees, mapped);
}

async function importGlobalEventAttendees() {
  type AttendeeData = {
    eventId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<AttendeeData>("21_global_event_attendees.json");
  const mapped = data.map((a) => ({
    eventId: a.eventId,
    userId: a.userId,
    createdAt: toDate(a.createdAt)!,
    updatedAt: toDate(a.updatedAt)!,
  }));

  return batchInsert(globalDanceEventAttendees, mapped);
}

async function importDancerInterests() {
  type InterestData = {
    dancerId: string;
    schoolId: string;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<InterestData>("22_dancer_interests.json");
  const mapped = data.map((i) => ({
    dancerId: i.dancerId,
    schoolId: i.schoolId,
    createdAt: toDate(i.createdAt)!,
    updatedAt: toDate(i.updatedAt)!,
  }));

  return batchInsert(interests, mapped);
}

async function importFavorites() {
  type FavoriteData = {
    id: string;
    schoolId: string;
    dancerId: string;
    platformName: "core" | "prodigy";
    comment: string | null;
    rating: number | null;
    lastContacted: string | null;
    lastNotification: string | null;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<FavoriteData>("23_favorites.json");
  const mapped = data.map((f) => ({
    id: f.id,
    schoolId: f.schoolId,
    dancerId: f.dancerId,
    platformName: f.platformName,
    comment: f.comment,
    rating: f.rating,
    lastContacted: toDate(f.lastContacted),
    lastNotification: toDate(f.lastNotification),
    createdAt: toDate(f.createdAt)!,
    updatedAt: toDate(f.updatedAt)!,
  }));

  return batchInsert(favorites, mapped);
}

async function importFollows() {
  type FollowData = {
    id: string;
    dancerId: string;
    schoolId: string;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<FollowData>("24_follows.json");
  const mapped = data.map((f) => ({
    id: f.id,
    dancerId: f.dancerId,
    schoolId: f.schoolId,
    createdAt: toDate(f.createdAt)!,
    updatedAt: toDate(f.updatedAt)!,
  }));

  return batchInsert(follows, mapped);
}

async function importCrvSubmissions() {
  type SubmissionData = {
    id: string;
    dancerId: string;
    schoolId: string;
    videoId: string;
    status: "pending" | "released" | "in_review" | "accepted";
    watched: boolean;
    watchedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<SubmissionData>("25_crv_submissions.json");
  const mapped = data.map((s) => ({
    id: s.id,
    dancerId: s.dancerId,
    schoolId: s.schoolId,
    videoId: s.videoId,
    status: s.status,
    watched: s.watched,
    watchedAt: toDate(s.watchedAt),
    createdAt: toDate(s.createdAt)!,
    updatedAt: toDate(s.updatedAt)!,
  }));

  return batchInsert(crvSubmissions, mapped);
}

async function importSubscriptions() {
  type SubscriptionData = {
    id: string;
    userId: string;
    source: "stripe";
    subscriptionId: string;
    customerId: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
    canceledAt: string | null;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<SubscriptionData>("26_subscriptions.json");
  const mapped = data.map((s) => ({
    id: s.id,
    userId: s.userId,
    source: s.source,
    subscriptionId: s.subscriptionId,
    customerId: s.customerId,
    cancelAtPeriodEnd: s.cancelAtPeriodEnd,
    currentPeriodEnd: toDate(s.currentPeriodEnd),
    canceledAt: toDate(s.canceledAt),
    createdAt: toDate(s.createdAt)!,
    updatedAt: toDate(s.updatedAt)!,
  }));

  return batchInsert(subscriptions, mapped);
}

async function importPosts() {
  type PostData = {
    id: string;
    slug: string;
    title: string;
    content: string;
    summary: string;
    description: string;
    thumbnail: string;
    tags: string[] | null;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<PostData>("27_posts.json");
  const mapped = data.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    content: p.content,
    summary: p.summary,
    description: p.description,
    thumbnail: p.thumbnail,
    tags: p.tags,
    createdAt: toDate(p.createdAt)!,
    updatedAt: toDate(p.updatedAt)!,
  }));

  return batchInsert(posts, mapped);
}

async function importVideoLibrary() {
  type LibraryData = {
    id: string;
    url: string;
    category: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<LibraryData>("28_video_library.json");
  const mapped = data.map((v) => ({
    id: v.id,
    url: v.url,
    category: v.category,
    title: v.title,
    createdAt: toDate(v.createdAt)!,
    updatedAt: toDate(v.updatedAt)!,
  }));

  return batchInsert(library, mapped);
}

async function importFeed() {
  type FeedData = {
    id: string;
    contentId: string;
    contentType: "image" | "video" | "profile" | "reference" | "achievement";
    payload: unknown;
    userId: string;
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<FeedData>("29_feed.json");
  const mapped = data.map((f) => ({
    id: f.id,
    contentId: f.contentId,
    contentType: f.contentType,
    payload: f.payload,
    userId: f.userId,
    createdAt: toDate(f.createdAt)!,
    updatedAt: toDate(f.updatedAt)!,
  }));

  return batchInsert(feed, mapped);
}

async function importNotifications() {
  type NotificationData = {
    id: string;
    userId: string;
    content: {
      type: string;
      senderUsername: string;
      senderProfilePicture: string | null;
      senderId: string;
      viewed: boolean;
    };
    createdAt: string;
    updatedAt: string;
  };

  const data = readJson<NotificationData>("30_notifications.json");
  const mapped = data.map((n) => ({
    id: n.id,
    userId: n.userId,
    content: n.content,
    createdAt: toDate(n.createdAt)!,
    updatedAt: toDate(n.updatedAt)!,
  }));

  return batchInsert(notifications, mapped);
}

// ==================== MAIN IMPORT FUNCTION ====================

async function main() {
  console.log("Starting import...\n");

  if (!existsSync(EXPORT_DIR)) {
    console.error(`❌ Export directory not found: ${EXPORT_DIR}`);
    console.log("   Run the export script first to generate JSON files.");
    process.exit(1);
  }

  // Phase 1: Core Users & Profiles
  console.log("Phase 1: Importing users and profiles...");
  const usersCount = await importUsers();
  console.log(`  ✓ Users: ${usersCount}`);

  const platformsCount = await importUserPlatforms();
  console.log(`  ✓ User Platforms: ${platformsCount}`);

  const dancerProfilesCount = await importDancerProfiles();
  console.log(`  ✓ Dancer Profiles: ${dancerProfilesCount}`);

  const schoolProfilesCount = await importSchoolProfiles();
  console.log(`  ✓ School Profiles: ${schoolProfilesCount}`);

  // Phase 2: Reference Data
  console.log("\nPhase 2: Importing reference data...");
  const skillsCount = await importSkills();
  console.log(`  ✓ Skills: ${skillsCount}`);

  const sportsCount = await importSports();
  console.log(`  ✓ Sports: ${sportsCount}`);

  const stylesCount = await importStyles();
  console.log(`  ✓ Styles: ${stylesCount}`);

  // Phase 3: Profile Extensions
  console.log("\nPhase 3: Importing profile extensions...");
  const achievementsCount = await importAchievements();
  console.log(`  ✓ Achievements: ${achievementsCount}`);

  const referencesCount = await importReferences();
  console.log(`  ✓ References: ${referencesCount}`);

  const dancerSkillsCount = await importDancerSkills();
  console.log(`  ✓ Dancer Skills: ${dancerSkillsCount}`);

  const schoolSkillsCount = await importSchoolSkills();
  console.log(`  ✓ School Skills: ${schoolSkillsCount}`);

  const dancerSportsCount = await importDancerSports();
  console.log(`  ✓ Dancer Sports: ${dancerSportsCount}`);

  const dancerStylesCount = await importDancerStyles();
  console.log(`  ✓ Dancer Styles: ${dancerStylesCount}`);

  const schoolSportsCount = await importSchoolSports();
  console.log(`  ✓ School Sports: ${schoolSportsCount}`);

  const schoolStylesCount = await importSchoolStyles();
  console.log(`  ✓ School Styles: ${schoolStylesCount}`);

  // Phase 4: Media
  console.log("\nPhase 4: Importing media...");
  const videosCount = await importProfileVideos();
  console.log(`  ✓ Profile Videos: ${videosCount}`);

  const imagesCount = await importProfileImages();
  console.log(`  ✓ Profile Images: ${imagesCount}`);

  // Phase 5: Events
  console.log("\nPhase 5: Importing events...");
  const eventsCount = await importDanceEvents();
  console.log(`  ✓ Dance Events: ${eventsCount}`);

  const globalEventsCount = await importGlobalDanceEvents();
  console.log(`  ✓ Global Events: ${globalEventsCount}`);

  const attendeesCount = await importEventAttendees();
  console.log(`  ✓ Event Attendees: ${attendeesCount}`);

  const globalAttendeesCount = await importGlobalEventAttendees();
  console.log(`  ✓ Global Event Attendees: ${globalAttendeesCount}`);

  // Phase 6: Relationships
  console.log("\nPhase 6: Importing relationships...");
  const interestsCount = await importDancerInterests();
  console.log(`  ✓ Dancer Interests: ${interestsCount}`);

  const favoritesCount = await importFavorites();
  console.log(`  ✓ Favorites: ${favoritesCount}`);

  const followsCount = await importFollows();
  console.log(`  ✓ Follows: ${followsCount}`);

  const crvCount = await importCrvSubmissions();
  console.log(`  ✓ CRV Submissions: ${crvCount}`);

  // Phase 7: Subscriptions
  console.log("\nPhase 7: Importing subscriptions...");
  const subscriptionsCount = await importSubscriptions();
  console.log(`  ✓ Subscriptions: ${subscriptionsCount}`);

  // Phase 8: Content
  console.log("\nPhase 8: Importing content...");
  const postsCount = await importPosts();
  console.log(`  ✓ Posts: ${postsCount}`);

  const libraryCount = await importVideoLibrary();
  console.log(`  ✓ Video Library: ${libraryCount}`);

  // Phase 9: Activity
  console.log("\nPhase 9: Importing activity...");
  const feedCount = await importFeed();
  console.log(`  ✓ Feed Items: ${feedCount}`);

  const notificationsCount = await importNotifications();
  console.log(`  ✓ Notifications: ${notificationsCount}`);

  console.log("\n✅ Import complete!");
}

main()
  .catch(console.error)
  .finally(() => db.$client.end());
