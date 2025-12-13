import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const ProspectStatus = {
    none: "none",
    released: "released",
    in_review: "in_review",
    accepted: "accepted"
} as const;
export type ProspectStatus = (typeof ProspectStatus)[keyof typeof ProspectStatus];
export const MediaType = {
    image: "image",
    video: "video"
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];
export const SubscriptionSource = {
    stripe: "stripe",
    revenuecat: "revenuecat"
} as const;
export type SubscriptionSource = (typeof SubscriptionSource)[keyof typeof SubscriptionSource];
export const PlatformName = {
    core: "core",
    prodigy: "prodigy"
} as const;
export type PlatformName = (typeof PlatformName)[keyof typeof PlatformName];
export type AwardsHistory = {
    id: Generated<string>;
    content: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
    dancer_id: string;
};
export type DancerAccount = {
    id: Generated<string>;
    birthday: Timestamp;
    biography: string | null;
    awards: string | null;
    references: string | null;
    instagram: string | null;
    tiktok: string | null;
    youtube: string | null;
    location: string | null;
    skill_level: string | null;
    team_level: string | null;
    high_school: string | null;
    studio: string | null;
    gpa: number | null;
    grad_year: number | null;
    training_hours: number | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
    user_id: string;
};
export type DancerPlatform = {
    joined_at: Generated<Timestamp>;
    account_id: string;
    platform_id: string;
};
export type Favorite = {
    id: Generated<string>;
    comment: string | null;
    rating: number | null;
    last_contacted: Timestamp | null;
    last_notification: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
    platform_id: string;
    from_id: string;
    to_id: string;
};
export type GlobalDanceEvent = {
    id: Generated<string>;
    name: string;
    location: string;
    description: string;
    website: string;
    organization: string;
    thumbnail: string;
    start_datetime: Timestamp;
    end_datetime: Timestamp;
    timezone: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type GlobalDanceEventAttendee = {
    registered_at: Generated<Timestamp>;
    event_id: string;
    user_id: string;
};
export type HiddenItem = {
    id: Generated<string>;
    created_at: Generated<Timestamp>;
    hidden_by_id: string;
    video_id: string | null;
    image_id: string | null;
};
export type LibraryVideo = {
    id: Generated<string>;
    category: string;
    youtube_id: string;
    title: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type Notification = {
    id: Generated<string>;
    content: unknown;
    created_at: Generated<Timestamp>;
    user_id: string;
};
export type OutboxEvent = {
    id: Generated<string>;
    type: string;
    payload: unknown;
    created_at: Generated<Timestamp>;
    published_at: Timestamp | null;
};
export type Platform = {
    id: Generated<string>;
    name: PlatformName;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type Post = {
    id: Generated<string>;
    title: string;
    content: string;
    summary: string;
    published: boolean;
    description: string | null;
    thumbnail: string;
    slug: string;
    tags: string[];
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type PostLike = {
    created_at: Generated<Timestamp>;
    post_id: string;
    user_id: string;
};
export type ProdigyDanceEvent = {
    id: Generated<string>;
    name: string;
    location: string;
    schedule: string | null;
    description: string | null;
    organization: string | null;
    website: string | null;
    start_datetime: Timestamp;
    end_datetime: Timestamp;
    timezone: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type ProdigyDanceEventAttendee = {
    bib_number: string;
    paid_tier: boolean;
    registered_at: Generated<Timestamp>;
    event_id: string;
    user_id: string;
};
export type ProdigyLibraryVideo = {
    id: Generated<string>;
    instructor: string;
    youtube_id: string;
    title: string;
    description: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
    event_id: string;
};
export type ProfileImage = {
    id: Generated<string>;
    url: string;
    caption: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
    user_id: string;
};
export type ProfileVideo = {
    id: Generated<string>;
    video_id: string;
    title: string;
    caption: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
    user_id: string;
};
export type ReferencesHistory = {
    id: Generated<string>;
    url: string;
    created_at: Generated<Timestamp>;
    deleted_at: Timestamp | null;
    dancer_id: string;
};
export type Role = {
    id: Generated<number>;
    type: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type SchoolAccount = {
    id: Generated<string>;
    name: string;
    location: string;
    division: string | null;
    benefits: string | null;
    about: string | null;
    website: string | null;
    time_commitment: string | null;
    head_coach: string | null;
    assistant_coach: string | null;
    tiktok: string | null;
    instagram: string | null;
    mission_statement: string | null;
    what_we_do: string | null;
    skill_requirements: string | null;
    competitions: string[];
    dance_styles: string[];
    sports: string[];
    gpa_requirement: number | null;
    school_size: number | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
    user_id: string;
};
export type SchoolDanceEvent = {
    id: Generated<string>;
    title: string;
    description: string | null;
    website: string | null;
    start_datetime: Timestamp;
    end_datetime: Timestamp;
    timezone: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
    host_id: string;
};
export type Subscription = {
    id: Generated<string>;
    subscription_id: string;
    customer_id: string | null;
    cancel_at_period_end: Generated<boolean>;
    current_period_end: Timestamp | null;
    canceled_at: Timestamp | null;
    source: SubscriptionSource;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
    user_id: string;
};
export type User = {
    id: Generated<string>;
    email: string;
    display_email: string;
    username: string;
    first_name: string;
    last_name: string;
    image: string | null;
    password: string;
    phone: string | null;
    last_logged_in: Timestamp;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type UserActivity = {
    id: Generated<string>;
    event_type: string;
    user_id: string;
    created_at: Generated<Timestamp>;
};
export type UserRole = {
    role_id: number;
    user_id: string;
    assigned_at: Generated<Timestamp>;
};
export type DB = {
    awards_history: AwardsHistory;
    dancer_accounts: DancerAccount;
    dancer_platforms: DancerPlatform;
    favorites: Favorite;
    global_dance_event_attendees: GlobalDanceEventAttendee;
    global_dance_events: GlobalDanceEvent;
    hidden_items: HiddenItem;
    library_videos: LibraryVideo;
    notifications: Notification;
    outbox: OutboxEvent;
    platforms: Platform;
    post_likes: PostLike;
    posts: Post;
    prodigy_dance_event_attendees: ProdigyDanceEventAttendee;
    prodigy_dance_events: ProdigyDanceEvent;
    prodigy_library_videos: ProdigyLibraryVideo;
    profile_images: ProfileImage;
    profile_videos: ProfileVideo;
    references_history: ReferencesHistory;
    roles: Role;
    school_accounts: SchoolAccount;
    school_dance_events: SchoolDanceEvent;
    subscriptions: Subscription;
    user_activities: UserActivity;
    user_roles: UserRole;
    users: User;
};
