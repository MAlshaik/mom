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
