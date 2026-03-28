"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getGoalPageData,
  claimGoalSlotAction,
  toggleGoalCompletionAction,
  type GoalPageData,
} from "@/server/actions/goals";
import { fireConfetti } from "@/lib/use-confetti";
import { Check, Plus } from "lucide-react";
import { NavBar } from "@/components/nav-bar";

interface GoalPageProps {
  groupId: string;
}

function formatDate(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(locale === "ar" ? "ar-SA-u-ca-islamic-umalqura" : "en-US-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function GoalPage({ groupId }: GoalPageProps) {
  const { locale } = useLocale();
  const [data, setData] = useState<GoalPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimName, setClaimName] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const loadData = useCallback(async () => {
    const result = await getGoalPageData(groupId);
    setData(result);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !data) {
    return (
      <>
        <NavBar />
        <div className="max-w-md mx-auto px-4 pb-4 space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-muted rounded-md" />
          <div className="h-4 w-64 bg-muted rounded-md" />
          <div className="h-3 w-40 bg-muted rounded-md" />
          <div className="h-12 w-full bg-muted rounded-lg" />
          <div className="h-4 w-32 bg-muted rounded-md" />
          <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex justify-between px-3 py-3 border-b border-foreground/5">
                <div className="h-4 w-28 bg-muted rounded-md" />
                <div className="h-4 w-16 bg-muted rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  const handleClaim = async () => {
    if (!claimName.trim()) return;
    setClaiming(true);
    const result = await claimGoalSlotAction(groupId, claimName.trim());
    if (result.success) {
      setClaimName("");
      setShowInput(false);
      fireConfetti();
      await loadData();
    }
    setClaiming(false);
  };

  const handleToggle = async (entryId: string, wasCompleted: boolean) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            entries: prev.entries.map((e) =>
              e.id === entryId ? { ...e, completed: !wasCompleted } : e
            ),
            completedCount: prev.completedCount + (wasCompleted ? -1 : 1),
          }
        : prev
    );
    if (!wasCompleted) fireConfetti();

    const result = await toggleGoalCompletionAction(entryId);
    if (!result.success) loadData();
  };

  // Check if past end date
  const now = new Date();
  const isPastEnd = data.group.endDate ? new Date(data.group.endDate) < now : false;

  return (
    <>
    <NavBar />
    <div className="max-w-md mx-auto px-4 pb-4 space-y-4">
      {data.group.bannerUrl && (
        <img
          src={data.group.bannerUrl}
          alt={data.group.name}
          className="w-full rounded-lg object-cover"
          style={{ aspectRatio: "1200/630" }}
        />
      )}

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">{data.group.name}</h1>
        {data.group.goalDescription && (
          <p className="text-muted-foreground text-sm">{data.group.goalDescription}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
          {data.group.startDate && (
            <span>{locale === "ar" ? "البداية" : "Start"}: {formatDate(data.group.startDate, locale)}</span>
          )}
          {data.group.endDate && (
            <>
              <span className="text-border">|</span>
              <span>{locale === "ar" ? "النهاية" : "End"}: {formatDate(data.group.endDate, locale)}</span>
            </>
          )}
        </div>
      </div>

      {/* Register button — above the table */}
      {!isPastEnd && (
        <div>
          {showInput ? (
            <div className="flex gap-2">
              <Input
                value={claimName}
                onChange={(e) => setClaimName(e.target.value)}
                placeholder={locale === "ar" ? "أدخلي اسمك..." : "Enter your name..."}
                autoFocus
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleClaim()}
              />
              <Button
                onClick={handleClaim}
                disabled={claiming}
                className="bg-[#1B3A6B] text-white hover:bg-[#152E55] dark:bg-[#1E4080] dark:hover:bg-[#16326A] cursor-pointer"
              >
                {claiming ? "..." : locale === "ar" ? "تسجيل" : "Register"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => { setShowInput(false); setClaimName(""); }}
                className="cursor-pointer"
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowInput(true)}
              className="w-full py-5 text-base bg-[#1B3A6B] text-white hover:bg-[#152E55] dark:bg-[#1E4080] dark:hover:bg-[#16326A] cursor-pointer gap-2"
            >
              <Plus className="h-5 w-5" />
              {locale === "ar" ? "سجّلي اسمك" : "Add your name"}
            </Button>
          )}
        </div>
      )}

      {isPastEnd && (
        <p className="text-center text-sm text-muted-foreground">
          {locale === "ar" ? "انتهت فترة التسجيل" : "Registration has ended"}
        </p>
      )}

      {/* Count */}
      <div className="text-sm text-muted-foreground">
        {data.claimedCount} {locale === "ar" ? "مسجّل" : "registered"} · {data.completedCount} {locale === "ar" ? "أنجزوا" : "completed"}
      </div>

      {/* Table */}
      {data.entries.length > 0 && (
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
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry, i) => (
                <tr
                  key={entry.id}
                  className={`
                    cursor-pointer transition-colors
                    ${entry.completed ? "bg-blue-50 dark:bg-blue-950/20" : "bg-card hover:bg-muted/30"}
                    ${i < data.entries.length - 1 ? "border-b border-foreground/5" : ""}
                  `}
                  onClick={() => handleToggle(entry.id, entry.completed)}
                >
                  <td className="px-3 py-2.5 flex items-center gap-2">
                    {entry.completed && (
                      <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                    <span className={entry.completed ? "text-blue-700 dark:text-blue-300" : ""}>
                      {entry.name}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">
                    {formatDate(entry.claimedAt, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </>
  );
}
