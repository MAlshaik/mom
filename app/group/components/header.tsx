"use client";

import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";

interface HeaderProps {
  hijriDate: {
    day: string;
    month: string;
    year: string;
    monthEn: string;
  };
  maghribTime: string;
  resetLabel?: string;
}

function to12Hour(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function Header({ hijriDate, maghribTime }: HeaderProps) {
  const { member } = useAuth();
  const { locale, t } = useLocale();

  const dateStr =
    locale === "ar"
      ? `${hijriDate.day} ${hijriDate.month} ${hijriDate.year} هـ`
      : `${hijriDate.day} ${hijriDate.monthEn} ${hijriDate.year} AH`;

  const timeDisplay = to12Hour(maghribTime);

  // Hijri months are 29 or 30 days — estimate days until end of month
  const hijriDayNum = parseInt(hijriDate.day) || 0;
  const daysLeft = Math.max(0, 30 - hijriDayNum);

  return (
    <div className="text-center space-y-3 pb-2">
      <h1 className="text-2xl font-bold tracking-tight">
        🌸 {t("appName")} 🌸
      </h1>
      <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
        <span>{dateStr}</span>
        <span className="text-border">|</span>
        <span>{t("maghrib")} {timeDisplay}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {t("daysUntilReset", { n: daysLeft })}
      </div>
      {member && (
        <div className="text-sm text-muted-foreground pt-1">
          {t("welcome")} {member.name}
        </div>
      )}
    </div>
  );
}
