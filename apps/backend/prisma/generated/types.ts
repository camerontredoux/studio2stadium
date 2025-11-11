import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Users = {
    id: Generated<string>;
    email: string;
    firstName: string;
    lastName: string;
    image: Generated<string>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp | null;
};
export type DB = {
    users: Users;
};
