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
export const AccountType = {
    dancer: "dancer",
    school: "school"
} as const;
export type AccountType = (typeof AccountType)[keyof typeof AccountType];
export type DancerAccount = {
    id: Generated<string>;
    user_id: string;
    birthday: Timestamp;
    biography: string | null;
    awards: string | null;
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
};
export type DancerAchievements = {
    id: Generated<string>;
    dancer_id: string;
    content: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type DancerPlatform = {
    account_id: string;
    platform_name: PlatformName;
    joined_at: Generated<Timestamp>;
};
export type DancerReferences = {
    id: Generated<string>;
    dancer_id: string;
    url: string;
    created_at: Generated<Timestamp>;
    deleted_at: Timestamp | null;
};
export type Favorite = {
    id: Generated<string>;
    from_user_id: string;
    to_user_id: string;
    platform_name: PlatformName;
    comment: string | null;
    rating: number | null;
    last_contacted: Timestamp | null;
    last_notification: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
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
    event_id: string;
    user_id: string;
    registered_at: Generated<Timestamp>;
};
export type GlobalNotification = {
    id: Generated<string>;
    content: unknown;
    created_at: Generated<Timestamp>;
};
export type HiddenItem = {
    id: Generated<string>;
    created_at: Generated<Timestamp>;
    hidden_by_id: string;
    media_id: string | null;
};
export type Notification = {
    id: Generated<string>;
    user_id: string;
    content: unknown;
    created_at: Generated<Timestamp>;
};
export type OutboxEvent = {
    id: Generated<string>;
    type: string;
    payload: unknown;
    created_at: Generated<Timestamp>;
    published_at: Timestamp | null;
};
export type Platform = {
    name: PlatformName;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type ProcessedEvent = {
    event_id: string;
    event_type: string;
    processed_at: Generated<Timestamp>;
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
export type ProfileMedia = {
    id: Generated<string>;
    user_id: string;
    media_id: string;
    caption: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type SchoolAccount = {
    id: Generated<string>;
    user_id: string;
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
};
export type SchoolDanceEvent = {
    id: Generated<string>;
    school_id: string;
    title: string;
    description: string | null;
    website: string | null;
    start_datetime: Timestamp;
    end_datetime: Timestamp;
    timezone: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type SchoolDanceEventAttendee = {
    event_id: string;
    user_id: string;
    registered_at: Generated<Timestamp>;
};
export type Subscription = {
    id: Generated<string>;
    source: SubscriptionSource;
    user_id: string;
    subscription_id: string;
    customer_id: string | null;
    cancel_at_period_end: Generated<boolean>;
    current_period_end: Timestamp | null;
    canceled_at: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type User = {
    id: Generated<string>;
    username: string;
    email: string;
    admin_access: PlatformName | null;
    account_type: AccountType;
    display_email: string;
    first_name: string;
    last_name: string;
    password: string;
    avatar: string | null;
    phone: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type UserActivity = {
    id: Generated<string>;
    event_type: string;
    platform_name: PlatformName | null;
    user_id: string;
    created_at: Generated<Timestamp>;
};
export type VideoLibrary = {
    id: Generated<string>;
    category: string;
    youtube_id: string;
    title: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type DB = {
    dancer_accounts: DancerAccount;
    dancer_achievements: DancerAchievements;
    dancer_platforms: DancerPlatform;
    dancer_references: DancerReferences;
    event_outbox: OutboxEvent;
    global_dance_event_attendees: GlobalDanceEventAttendee;
    global_dance_events: GlobalDanceEvent;
    global_notifications: GlobalNotification;
    notifications: Notification;
    platforms: Platform;
    processed_events: ProcessedEvent;
    prodigy_dance_event_attendees: ProdigyDanceEventAttendee;
    prodigy_dance_events: ProdigyDanceEvent;
    prodigy_library_videos: ProdigyLibraryVideo;
    school_accounts: SchoolAccount;
    school_dance_event_attendees: SchoolDanceEventAttendee;
    school_dance_events: SchoolDanceEvent;
    user_activities: UserActivity;
    user_favorites: Favorite;
    user_hidden_items: HiddenItem;
    user_profile_media: ProfileMedia;
    user_subscriptions: Subscription;
    users: User;
    video_library: VideoLibrary;
};
