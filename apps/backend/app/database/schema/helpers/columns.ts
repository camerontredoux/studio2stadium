import { customType, timestamp } from "drizzle-orm/pg-core";

const utcNow = () => new Date();

export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(utcNow),
};

export const citext = customType<{ data: string }>({
  dataType: () => "citext",
});
