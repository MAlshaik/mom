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
  slug: text("slug").notNull().unique(),
  type: text("type").notNull().default("khatm"), // "khatm" | "goal"
  city: text("city").notNull().default("Qatif"),
  country: text("country").notNull().default("Saudi Arabia"),
  startDate: date("start_date").notNull(),
  resetType: text("reset_type").notNull().default("prayer"), // "fixed" | "prayer"
  resetValue: text("reset_value").notNull().default("Maghrib"), // prayer name or "HH:MM"
  goalDescription: text("goal_description"),
  targetCount: integer("target_count"),
  bannerUrl: text("banner_url"),
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
    startingJuz: integer("starting_juz").notNull(), // primary juz, used for code generation
    isAdmin: boolean("is_admin").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.groupId, table.startingJuz)]
);

// A member can be assigned multiple juz. Each row = one juz assignment.
export const memberJuz = pgTable(
  "member_juz",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: uuid("member_id")
      .references(() => members.id, { onDelete: "cascade" })
      .notNull(),
    groupId: uuid("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    startingJuz: integer("starting_juz").notNull(),
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
    startingJuz: integer("starting_juz"), // which juz assignment this entry is for (null = legacy all-at-once)
    hijriMonth: text("hijri_month").notNull().default(""),
    hijriYear: text("hijri_year").notNull().default(""),
    completed: boolean("completed").notNull().default(false),
    markedAt: timestamp("marked_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.memberId, table.khatmDay, table.startingJuz, table.hijriMonth, table.hijriYear)]
);

export const maghribCache = pgTable("maghrib_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  gregorianDate: date("gregorian_date").notNull().unique(),
  maghribTime: text("maghrib_time").notNull(),
  fajrTime: text("fajr_time"),
  dhuhrTime: text("dhuhr_time"),
  asrTime: text("asr_time"),
  ishaTime: text("isha_time"),
  hijriDay: text("hijri_day").notNull(),
  hijriMonth: text("hijri_month").notNull(),
  hijriYear: text("hijri_year").notNull(),
  hijriMonthAr: text("hijri_month_ar").notNull(),
});

export const goalEntries = pgTable("goal_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  completed: boolean("completed").notNull().default(false),
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});
