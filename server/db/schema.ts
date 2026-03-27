import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  date,
  uuid,
  unique,
} from "drizzle-orm/pg-core";

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull().default("Qatif"),
  country: text("country").notNull().default("Saudi Arabia"),
  startDate: date("start_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const members = pgTable(
  "members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    startingJuz: integer("starting_juz").notNull(),
    isAdmin: boolean("is_admin").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.groupId, table.startingJuz)]
);

export const dailyEntries = pgTable(
  "daily_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: uuid("member_id")
      .references(() => members.id, { onDelete: "cascade" })
      .notNull(),
    khatmDay: integer("khatm_day").notNull(),
    completed: boolean("completed").notNull().default(false),
    markedAt: timestamp("marked_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.memberId, table.khatmDay)]
);

export const maghribCache = pgTable("maghrib_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  gregorianDate: date("gregorian_date").notNull().unique(),
  maghribTime: text("maghrib_time").notNull(),
  hijriDay: text("hijri_day").notNull(),
  hijriMonth: text("hijri_month").notNull(),
  hijriYear: text("hijri_year").notNull(),
  hijriMonthAr: text("hijri_month_ar").notNull(),
});
