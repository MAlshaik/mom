const ARABIC_TO_ENGLISH: Record<string, string> = {
  "ا": "A",
  "أ": "A",
  "إ": "I",
  "آ": "A",
  "ب": "B",
  "ت": "T",
  "ث": "T",
  "ج": "J",
  "ح": "H",
  "خ": "K",
  "د": "D",
  "ذ": "D",
  "ر": "R",
  "ز": "Z",
  "س": "S",
  "ش": "S",
  "ص": "S",
  "ض": "D",
  "ط": "T",
  "ظ": "Z",
  "ع": "A",
  "غ": "G",
  "ف": "F",
  "ق": "Q",
  "ك": "K",
  "ل": "L",
  "م": "M",
  "ن": "N",
  "ه": "H",
  "و": "W",
  "ي": "Y",
  "ة": "H",
  "ى": "A",
};

export function arabicToEnglishLetter(name: string): string {
  const firstChar = name.trim().charAt(0);
  // If already English, use it directly
  if (/[a-zA-Z]/.test(firstChar)) {
    return firstChar.toUpperCase();
  }
  return ARABIC_TO_ENGLISH[firstChar] || "X";
}

export function generateCode(name: string, startingJuz: number): string {
  return `${arabicToEnglishLetter(name)}${startingJuz}`;
}

// Common Arabic words to their standard English transliteration
const ARABIC_WORDS: Record<string, string> = {
  "ختم": "khatm",
  "المهدوي": "al-mahdawi",
  "القرآن": "al-quran",
  "سورة": "surah",
  "يس": "yasin",
  "الفاتحة": "al-fatiha",
  "البقرة": "al-baqara",
  "رمضان": "ramadan",
  "شعبان": "shaban",
  "محرم": "muharram",
};

export function generateSlug(name: string): string {
  let result = name.trim().toLowerCase();

  // Try word-level replacements first
  for (const [ar, en] of Object.entries(ARABIC_WORDS)) {
    result = result.replace(new RegExp(ar, "g"), en);
  }

  // Transliterate remaining Arabic characters
  let slug = "";
  for (const char of result) {
    if (/[a-z0-9]/.test(char)) {
      slug += char;
    } else if (char === " " || char === "-") {
      slug += "-";
    } else if (ARABIC_TO_ENGLISH[char]) {
      slug += ARABIC_TO_ENGLISH[char].toLowerCase();
    }
  }

  slug = slug.replace(/-+/g, "-").replace(/^-|-$/g, "");

  // Append short random suffix for uniqueness
  const suffix = Math.random().toString(36).substring(2, 6);
  return slug ? `${slug}-${suffix}` : suffix;
}
