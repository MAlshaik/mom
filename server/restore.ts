import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { generateCode, generateSlug } from "../lib/arabic-to-english";

const sql = postgres(process.env.DATABASE_URL!);

const MEMBERS = [
  "عقيلة كاظم",
  "زينب أحمد",
  "عصيم الفردان",
  "إبتسام الناصر1",
  "حنان الخليفة",
  "مريم الفردان",
  "ليلى",
  "نجف المرزوق",
  "مواهب العلويات",
  "ليلى المطرود",
  "خاتون كاظم",
  "رحاب العلويات",
  "رجاء العسيف",
  "حسناء",
  "نوال الشايب",
  "عقيلة العلويات",
  "زهراء آل عليوي",
  "إبتسام الناصر",
  "آمنة الشخص",
  "رملة المرزوق",
  "رباب السعيدي",
  "صفا السعيدي",
  "زهراء الزين",
  "زهراء العسيف",
  "بدرية العسيف",
  "زينب محمد",
  "فاطمة محمد",
  "مروة الخضراوي",
  "مروة الخضراوي",
  "مروة الخضراوي",
];

async function restore() {
  console.log("Restoring group...");

  const slug = generateSlug("ختم المهدوي");

  const [group] = await sql`
    INSERT INTO groups (name, slug, type, city, country, start_date, reset_type, reset_value)
    VALUES ('ختم المهدوي', ${slug}, 'khatm', 'Qatif', 'Saudi Arabia', '2026-03-28', 'prayer', 'Maghrib')
    RETURNING id, slug
  `;
  console.log("Created group:", group.id, "slug:", group.slug);

  const usedCodes = new Set<string>();

  for (let i = 0; i < MEMBERS.length; i++) {
    const name = MEMBERS[i];
    const startingJuz = i + 1;
    let code = generateCode(name, startingJuz);

    // Handle code collisions (duplicate names get different codes)
    let attempt = 0;
    while (usedCodes.has(code)) {
      attempt++;
      code = `${generateCode(name, startingJuz)}${attempt}`;
    }
    usedCodes.add(code);

    await sql`
      INSERT INTO members (group_id, name, code, starting_juz, is_admin)
      VALUES (${group.id}, ${name}, ${code}, ${startingJuz}, false)
    `;
    console.log(`  ${startingJuz}. ${name} (${code})`);
  }

  console.log(`\nRestored ${MEMBERS.length} members.`);
  console.log(`Group slug: ${group.slug}`);
  console.log("Done!");
  await sql.end();
}

restore().catch((e) => {
  console.error(e);
  process.exit(1);
});
