import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Migrating juz assignments...");

  // Get all members
  const members = await sql`SELECT id, group_id, name, code, starting_juz FROM members ORDER BY starting_juz`;
  console.log(`Found ${members.length} members`);

  // Step 1: Insert member_juz for each member's startingJuz
  for (const m of members) {
    await sql`
      INSERT INTO member_juz (member_id, group_id, starting_juz)
      VALUES (${m.id}, ${m.group_id}, ${m.starting_juz})
      ON CONFLICT DO NOTHING
    `;
  }
  console.log("Created initial juz assignments");

  // Step 2: Find duplicates (same name + same group)
  const duplicates = await sql`
    SELECT name, group_id, array_agg(id ORDER BY starting_juz) as ids, array_agg(starting_juz ORDER BY starting_juz) as juzs, array_agg(code ORDER BY starting_juz) as codes
    FROM members
    GROUP BY name, group_id
    HAVING count(*) > 1
  `;

  console.log(`\nFound ${duplicates.length} duplicate names to merge:`);

  for (const dup of duplicates) {
    const ids = dup.ids as string[];
    const juzs = dup.juzs as number[];
    const codes = dup.codes as string[];
    const keepId = ids[0]; // Keep the first record
    const mergeIds = ids.slice(1); // Merge the rest into the first

    console.log(`\n  ${dup.name}: keeping ${codes[0]} (juz ${juzs[0]}), merging juz [${juzs.slice(1).join(", ")}]`);

    // Reassign member_juz entries from merged members to the kept member
    for (const mergeId of mergeIds) {
      await sql`
        UPDATE member_juz SET member_id = ${keepId} WHERE member_id = ${mergeId}
      `;
    }

    // Move any daily_entries from merged members to the kept member
    for (const mergeId of mergeIds) {
      await sql`
        UPDATE daily_entries SET member_id = ${keepId} WHERE member_id = ${mergeId}
      `;
    }

    // Delete the merged member records
    for (const mergeId of mergeIds) {
      await sql`DELETE FROM members WHERE id = ${mergeId}`;
      console.log(`    Deleted member ${mergeId}`);
    }
  }

  // Verify
  const finalMembers = await sql`SELECT id, name, code, starting_juz FROM members ORDER BY starting_juz`;
  const finalJuz = await sql`SELECT mj.member_id, m.name, mj.starting_juz FROM member_juz mj JOIN members m ON m.id = mj.member_id ORDER BY mj.starting_juz`;

  console.log(`\n--- Final state ---`);
  console.log(`Members: ${finalMembers.length}`);
  console.log(`Juz assignments: ${finalJuz.length}`);

  // Show members with multiple juz
  const juzByMember = new Map<string, number[]>();
  for (const j of finalJuz) {
    const list = juzByMember.get(j.name) ?? [];
    list.push(j.starting_juz);
    juzByMember.set(j.name, list);
  }
  for (const [name, juzs] of juzByMember) {
    if (juzs.length > 1) {
      console.log(`  ${name}: juz [${juzs.join(", ")}]`);
    }
  }

  console.log("\nDone!");
  await sql.end();
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
