"use client";

import { useLocale } from "@/lib/locale-context";
import { Check } from "lucide-react";

interface GoalEntry {
  id: string;
  name: string;
  completed: boolean;
  claimedAt: string;
}

interface GoalEntriesAdminProps {
  entries: GoalEntry[];
  onToggle: (entryId: string) => Promise<void>;
}

function formatDate(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(locale === "ar" ? "ar-SA-u-ca-islamic-umalqura" : "en-US-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

export function GoalEntriesAdmin({ entries, onToggle }: GoalEntriesAdminProps) {
  const { locale } = useLocale();

  if (entries.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-6">
        {locale === "ar" ? "لا يوجد مسجلون بعد" : "No entries yet"}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-sm">
        {locale === "ar" ? "المسجلون" : "Entries"} ({entries.length})
      </h2>
      <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-start px-3 py-2.5 font-medium text-muted-foreground">
                {locale === "ar" ? "الاسم" : "Name"}
              </th>
              <th className="text-start px-3 py-2.5 font-medium text-muted-foreground">
                {locale === "ar" ? "التاريخ" : "Date"}
              </th>
              <th className="px-3 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={entry.id}
                className={`
                  cursor-pointer transition-colors
                  ${entry.completed ? "bg-blue-50 dark:bg-blue-950/20" : "bg-card hover:bg-muted/30"}
                  ${i < entries.length - 1 ? "border-b border-foreground/5" : ""}
                `}
                onClick={() => onToggle(entry.id)}
              >
                <td className="px-3 py-2.5">
                  <span className={entry.completed ? "text-blue-700 dark:text-blue-300" : ""}>
                    {entry.name}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground text-xs">
                  {formatDate(entry.claimedAt, locale)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {entry.completed && (
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 inline" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
