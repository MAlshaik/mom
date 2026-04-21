CREATE TABLE "member_juz" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"starting_juz" integer NOT NULL,
	CONSTRAINT "member_juz_group_id_starting_juz_unique" UNIQUE("group_id","starting_juz")
);
--> statement-breakpoint
ALTER TABLE "member_juz" ADD CONSTRAINT "member_juz_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_juz" ADD CONSTRAINT "member_juz_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;