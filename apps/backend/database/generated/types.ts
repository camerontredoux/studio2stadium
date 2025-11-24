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
export const UserType = {
    dancer: "dancer",
    school: "school"
} as const;
export type UserType = (typeof UserType)[keyof typeof UserType];
export const MediaType = {
    image: "image",
    video: "video"
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];
export type Awards = {
    id: Generated<string>;
    content: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
    dancer_id: string;
};
export type DancerAccounts = {
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
export type DancerAccountsTypes = {
    account_id: string;
    type_id: number;
};
export type DancerTypes = {
    id: Generated<number>;
    name: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type Favorites = {
    id: Generated<string>;
    favoritable_type: UserType;
    favoritable_id: string;
    comment: string | null;
    rating: number | null;
    last_contacted: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
    user_id: string;
};
export type PasswordResetTokens = {
    token_hash: string;
    user_id: string;
    expires_at: Timestamp;
    created_at: Generated<Timestamp>;
};
export type ProdigyEvent = {
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
export type ProdigyEventAttendees = {
    id: Generated<string>;
    event_id: string;
    user_id: string;
    user_type: UserType;
    registered_at: Generated<Timestamp>;
};
export type Roles = {
    id: Generated<number>;
    type: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type SchoolAccounts = {
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
export type Subscriptions = {
    id: Generated<string>;
    subscription_id: string;
    customer_id: string;
    price_id: string;
    cancel_at_period_end: Generated<boolean>;
    current_period_end: Timestamp | null;
    canceled_at: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
    user_id: string;
};
export type Users = {
    id: Generated<string>;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    image: string;
    password_hash: string;
    phone: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp | null;
};
export type UsersRoles = {
    role_id: number;
    user_id: string;
    assigned_at: Generated<Timestamp>;
};
export type DB = {
    awards: Awards;
    dancer_accounts: DancerAccounts;
    dancer_accounts_types: DancerAccountsTypes;
    dancer_types: DancerTypes;
    favorites: Favorites;
    password_reset_tokens: PasswordResetTokens;
    prodigy_event_attendees: ProdigyEventAttendees;
    prodigy_events: ProdigyEvent;
    roles: Roles;
    school_accounts: SchoolAccounts;
    subscriptions: Subscriptions;
    users: Users;
    users_roles: UsersRoles;
};
