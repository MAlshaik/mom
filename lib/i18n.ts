export type Locale = "ar" | "en";

const translations = {
  ar: {
    appName: "ختم المهدوي",
    login: "دخول",
    logout: "خروج",
    enterCode: "أدخلي رمزك",
    welcome: "مرحبًا،",
    yourJuzToday: "جزؤكِ اليوم",
    juz: "الجزء",
    completed: "أنجزتُ",
    completedAlhamdulillah: "تم بحمد الله",
    undo: "تراجع",
    maghrib: "المغرب",
    today: "اليوم",
    yesterday: "الأمس",
    daysAgo: "قبل {n} أيام",
    missedDays: "لديكِ أيام لم تُسجَّل",
    register: "سجّلي",
    doneCount: "تم الإنجاز",
    notDoneCount: "غير منجز",
    of: "من",
    admin: "لوحة الإدارة",
    back: "العودة",
    members: "الأعضاء",
    addMember: "إضافة عضوة",
    removeMember: "حذف",
    editMember: "تعديل",
    memberName: "الاسم",
    memberCode: "الرمز",
    startingJuz: "جزء البداية",
    save: "حفظ",
    cancel: "إلغاء",
    copyWhatsApp: "نسخ للواتساب",
    copied: "تم النسخ!",
    todayReport: "تقرير اليوم",
    theme: "المظهر",
    language: "اللغة",
    unassigned: "غير مأخوذ",
    undone: "غير منجز",
    done: "تم الإنجاز",
    groupStartDate: "تاريخ بداية المجموعة",
    note: "ملاحظة: يتغير اليوم عند أذان المغرب",
    daysUntilReset: "باقي على التجديد: {n} يوم",
  },
  en: {
    appName: "Khatm Al-Mahdawi",
    login: "Login",
    logout: "Logout",
    enterCode: "Enter your code",
    welcome: "Welcome,",
    yourJuzToday: "Your juz today",
    juz: "Juz",
    completed: "I completed it",
    completedAlhamdulillah: "Done, Alhamdulillah",
    undo: "Undo",
    maghrib: "Maghrib",
    today: "Today",
    yesterday: "Yesterday",
    daysAgo: "{n} days ago",
    missedDays: "You have unregistered days",
    register: "Register",
    doneCount: "Completed",
    notDoneCount: "Not done",
    of: "of",
    admin: "Admin Panel",
    back: "Back",
    members: "Members",
    addMember: "Add Member",
    removeMember: "Remove",
    editMember: "Edit",
    memberName: "Name",
    memberCode: "Code",
    startingJuz: "Starting Juz",
    save: "Save",
    cancel: "Cancel",
    copyWhatsApp: "Copy for WhatsApp",
    copied: "Copied!",
    todayReport: "Today's Report",
    theme: "Theme",
    language: "Language",
    unassigned: "Unassigned",
    undone: "Not done",
    done: "Completed",
    groupStartDate: "Group start date",
    note: "Note: The day changes at Maghrib adan time",
    daysUntilReset: "{n} days until reset",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["ar"];

export function t(locale: Locale, key: TranslationKey, params?: Record<string, string | number>): string {
  let text = translations[locale][key] as string;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export function getDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
