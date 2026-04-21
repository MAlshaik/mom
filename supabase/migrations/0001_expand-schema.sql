CREATE TABLE "goal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"name" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "daily_entries" DROP CONSTRAINT "daily_entries_member_id_khatm_day_unique";--> statement-breakpoint
ALTER TABLE "daily_entries" ADD COLUMN "hijri_month" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_entries" ADD COLUMN "hijri_year" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "type" text DEFAULT 'khatm' NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "reset_type" text DEFAULT 'prayer' NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "reset_value" text DEFAULT 'Maghrib' NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "goal_description" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "target_count" integer;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "banner_url" text;--> statement-breakpoint
ALTER TABLE "maghrib_cache" ADD COLUMN "fajr_time" text;--> statement-breakpoint
ALTER TABLE "maghrib_cache" ADD COLUMN "dhuhr_time" text;--> statement-breakpoint
ALTER TABLE "maghrib_cache" ADD COLUMN "asr_time" text;--> statement-breakpoint
ALTER TABLE "maghrib_cache" ADD COLUMN "isha_time" text;--> statement-breakpoint
ALTER TABLE "goal_entries" ADD CONSTRAINT "goal_entries_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_entries" ADD CONSTRAINT "daily_entries_member_id_khatm_day_hijri_month_hijri_year_unique" UNIQUE("member_id","khatm_day","hijri_month","hijri_year");--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_slug_unique" UNIQUE("slug");