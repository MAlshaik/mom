import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { generateCode } from "../lib/arabic-to-english";

const sql = postgres(process.env.DATABASE_URL!);

const MEMBERS = [
  { name: "فاطمة بو سرير", startingJuz: 1 },
  { name: "تهاني العنكي", startingJuz: 2 },
  { name: "عقيلة المطرود", startingJuz: 3, isAdmin: true },
  { name: "رقية الصديق", startingJuz: 4 },
  { name: "منيرة السادة", startingJuz: 5 },
  { name: "أمل غزوي", startingJuz: 6 },
  { name: "إيمان الصايغ", startingJuz: 7 },
  { name: "زينب رضا الناصر", startingJuz: 8 },
  { name: "علياء الناصر", startingJuz: 9 },
  { name: "منى الناصر", startingJuz: 10 },
  { name: "زينب المسيليم", startingJuz: 11 },
  { name: "حميدة آل سنبل", startingJuz: 12 },
  { name: "أسدية أبو فور", startingJuz: 13 },
  { name: "حليمة المرهون", startingJuz: 14 },
  { name: "إيمان آل مطر", startingJuz: 15 },
  { name: "تغريد الناصر", startingJuz: 16 },
  { name: "رجاء الجشي", startingJuz: 17 },
  { name: "حليمة الناصر", startingJuz: 18 },
  { name: "شهزلان الصفار", startingJuz: 19 },
  { name: "نجاح الناصر", startingJuz: 20 },
  { name: "نهى الناصر", startingJuz: 21 },
  { name: "هاشمية الخضراوي", startingJuz: 22 },
  { name: "زينب العنكي", startingJuz: 23 },
  { name: "حنان عويوي", startingJuz: 24 },
  { name: "أماني آل حسن", startingJuz: 25 },
  { name: "مريم المحسن", startingJuz: 26 },
];

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await sql`DELETE FROM daily_entries`;
  await sql`DELETE FROM members`;
  await sql`DELETE FROM groups`;
  await sql`DELETE FROM maghrib_cache`;

  // Create group
  const today = new Date().toISOString().split("T")[0];
  const [group] = await sql`
    INSERT INTO groups (name, city, country, start_date)
    VALUES ('ختم المهدوي', 'Qatif', 'Saudi Arabia', ${today})
    RETURNING id
  `;
  console.log("Created group:", group.id);

  // Create members
  for (const m of MEMBERS) {
    const code = generateCode(m.name, m.startingJuz);
    await sql`
      INSERT INTO members (group_id, name, code, starting_juz, is_admin)
      VALUES (${group.id}, ${m.name}, ${code}, ${m.startingJuz}, ${m.isAdmin ?? false})
    `;
    console.log(`  Added: ${m.name} (${code})`);
  }

  console.log(`\nSeeded ${MEMBERS.length} members.`);
  console.log("Done!");
  await sql.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
