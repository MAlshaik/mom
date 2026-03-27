"use client";

import { useTheme } from "next-themes";
import { useLocale } from "@/lib/locale-context";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";

export function Footer() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const { member, logout } = useAuth();

  return (
    <footer className="mt-auto border-t border-border py-3 px-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
            aria-label={t("theme")}
          >
            <Sun className="h-3.5 w-3.5 dark:hidden" />
            <Moon className="h-3.5 w-3.5 hidden dark:block" />
          </button>
          <button
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            {locale === "ar" ? "EN" : "عربي"}
          </button>
          {member && (
            <button
              onClick={logout}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              {t("logout")}
            </button>
          )}
        </div>
        <Link
          href="/admin"
          className="hover:text-foreground transition-colors"
        >
          {t("admin")}
        </Link>
      </div>
    </footer>
  );
}
