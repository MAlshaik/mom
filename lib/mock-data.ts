export interface MockMember {
  id: string;
  name: string;
  code: string;
  startingJuz: number;
  isAdmin: boolean;
}

export interface MockEntry {
  memberId: string;
  khatmDay: number;
  completed: boolean;
}

export interface MockSlot {
  juz: number;
  juzLabel?: string;
  member: MockMember | null;
  completed: boolean;
}

export const MOCK_MEMBERS: MockMember[] = [
  { id: "1", name: "فاطمة بو سرير", code: "F1", startingJuz: 1, isAdmin: false },
  { id: "2", name: "تهاني العنكي", code: "T2", startingJuz: 2, isAdmin: false },
  { id: "3", name: "عقيلة المطرود", code: "A3", startingJuz: 3, isAdmin: true },
  { id: "4", name: "رقية الصديق", code: "R4", startingJuz: 4, isAdmin: false },
  { id: "5", name: "منيرة السادة", code: "M5", startingJuz: 5, isAdmin: false },
  { id: "6", name: "أمل غزوي", code: "A6", startingJuz: 6, isAdmin: false },
  { id: "7", name: "إيمان الصايغ", code: "I7", startingJuz: 7, isAdmin: false },
  { id: "8", name: "زينب رضا الناصر", code: "Z8", startingJuz: 8, isAdmin: false },
  { id: "9", name: "علياء الناصر", code: "A9", startingJuz: 9, isAdmin: false },
  { id: "10", name: "منى الناصر", code: "M10", startingJuz: 10, isAdmin: false },
  { id: "11", name: "زينب المسيليم", code: "Z11", startingJuz: 11, isAdmin: false },
  { id: "12", name: "حميدة آل سنبل", code: "H12", startingJuz: 12, isAdmin: false },
  { id: "13", name: "أسدية أبو فور", code: "A13", startingJuz: 13, isAdmin: false },
  { id: "14", name: "حليمة المرهون", code: "H14", startingJuz: 14, isAdmin: false },
  { id: "15", name: "إيمان آل مطر", code: "I15", startingJuz: 15, isAdmin: false },
  { id: "16", name: "تغريد الناصر", code: "T16", startingJuz: 16, isAdmin: false },
  { id: "17", name: "رجاء الجشي", code: "R17", startingJuz: 17, isAdmin: false },
  { id: "18", name: "حليمة الناصر", code: "H18", startingJuz: 18, isAdmin: false },
  { id: "19", name: "شهزلان الصفار", code: "S19", startingJuz: 19, isAdmin: false },
  { id: "20", name: "نجاح الناصر", code: "N20", startingJuz: 20, isAdmin: false },
  { id: "21", name: "نهى الناصر", code: "N21", startingJuz: 21, isAdmin: false },
  { id: "22", name: "هاشمية الخضراوي", code: "H22", startingJuz: 22, isAdmin: false },
  { id: "23", name: "زينب العنكي", code: "Z23", startingJuz: 23, isAdmin: false },
  { id: "24", name: "حنان عويوي", code: "H24", startingJuz: 24, isAdmin: false },
  { id: "25", name: "أماني آل حسن", code: "A25", startingJuz: 25, isAdmin: false },
  { id: "26", name: "مريم المحسن", code: "M26", startingJuz: 26, isAdmin: false },
];

// Simulate khatm day 8 (8 days since start)
export const MOCK_KHATM_DAY = 8;

// For day 8, juz assignment = ((startingJuz - 1 + 8) % 30) + 1
export function getJuzForDay(startingJuz: number, khatmDay: number): number {
  return ((startingJuz - 1 + khatmDay) % 30) + 1;
}

// Mock completions for today — roughly half done
const COMPLETED_MEMBER_IDS = new Set([
  "1", "3", "4", "9", "10", "13", "14", "15", "16", "25", "26", "29", "30",
]);

// Mock: member 3 (عقيلة) has 2 missed days
export const MOCK_MISSED_DAYS = [
  { khatmDay: 6, juz: getJuzForDay(3, 6) },
  { khatmDay: 7, juz: getJuzForDay(3, 7) },
];

export function getMockSlots(khatmDay: number): MockSlot[] {
  // Build a map of juz -> member for this day
  const juzToMember = new Map<number, MockMember>();
  for (const member of MOCK_MEMBERS) {
    const juz = getJuzForDay(member.startingJuz, khatmDay);
    juzToMember.set(juz, member);
  }

  // Generate all 30 slots
  return Array.from({ length: 30 }, (_, i) => {
    const juz = i + 1;
    const member = juzToMember.get(juz) ?? null;
    return {
      juz,
      member,
      completed: member ? COMPLETED_MEMBER_IDS.has(member.id) : false,
    };
  });
}

export const MOCK_HIJRI_DATE = {
  day: "٠٨",
  month: "شوال",
  year: "١٤٤٧",
  monthEn: "Shawwal",
};

export const MOCK_MAGHRIB_TIME = "18:30";

export const MOCK_CURRENT_MEMBER = MOCK_MEMBERS[2]; // عقيلة المطرود (admin)
