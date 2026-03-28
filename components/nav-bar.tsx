"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

interface NavBarProps {
  href?: string;
  label?: string;
}

export function NavBar({ href = "/", label }: NavBarProps) {
  const { locale, t } = useLocale();
  const BackArrow = locale === "ar" ? ArrowRight : ArrowLeft;
  const backLabel = label ?? t("back");

  return (
    <nav className="max-w-md mx-auto px-4 pt-4 pb-1">
      <Link
        href={href}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <BackArrow className="h-4 w-4" />
        {backLabel}
      </Link>
    </nav>
  );
}
