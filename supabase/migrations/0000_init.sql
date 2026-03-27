CREATE TABLE "daily_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"khatm_day" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"marked_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_entries_member_id_khatm_day_unique" UNIQUE("member_id","khatm_day")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"city" text DEFAULT 'Qatif' NOT NULL,
	"country" text DEFAULT 'Saudi Arabia' NOT NULL,
	"start_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maghrib_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gregorian_date" date NOT NULL,
	"maghrib_time" text NOT NULL,
	"hijri_day" text NOT NULL,
	"hijri_month" text NOT NULL,
	"hijri_year" text NOT NULL,
	"hijri_month_ar" text NOT NULL,
	CONSTRAINT "maghrib_cache_gregorian_date_unique" UNIQUE("gregorian_date")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"starting_juz" integer NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "members_code_unique" UNIQUE("code"),
	CONSTRAINT "members_group_id_starting_juz_unique" UNIQUE("group_id","starting_juz")
);
--> statement-breakpoint
ALTER TABLE "daily_entries" ADD CONSTRAINT "daily_entries_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;