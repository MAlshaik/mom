"use client";

import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import type { MemberInfo } from "./group-detail";

interface WhatsAppReportProps {
  members: MemberInfo[];
}

export function WhatsAppReport({ members }: WhatsAppReportProps) {
  const { locale, t } = useLocale();
  const [copied, setCopied] = useState(false);

  // For now, show all members — completion status will come from real data later
  const lines = members.map((m) => {
    return `${m.name} ❗`;
  });

  const report = [
    `${locale === "ar" ? "ختم المهدوي" : "Khatm Al-Mahdawi"}`,
    "",
    ...lines,
    "",
    `${locale === "ar" ? "تم" : "Done"}: 0 / ${members.length}`,
  ].join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (members.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">{t("todayReport")}</h2>
          <Button
            size="sm"
            onClick={handleCopy}
            className={`gap-1.5 cursor-pointer ${
              copied
                ? "bg-[#1B3A6B] text-white"
                : "bg-[#1B3A6B] text-white hover:bg-[#152E55]"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                {t("copied")}
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                {t("copyWhatsApp")}
              </>
            )}
          </Button>
        </div>

        <pre
          dir="rtl"
          className="text-xs bg-muted p-3 rounded-lg whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto"
        >
          {report}
        </pre>
      </CardContent>
    </Card>
  );
}
