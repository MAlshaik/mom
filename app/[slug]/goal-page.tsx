"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getGoalPageData,
  claimGoalSlotAction,
  toggleGoalCompletionAction,
  type GoalPageData,
} from "@/server/actions/goals";
import { fireConfetti } from "@/lib/use-confetti";
import { Check, Plus, Pencil } from "lucide-react";
import { NavBar } from "@/components/nav-bar";

interface GoalPageProps {
  groupId: string;
}

const storageKey = (groupId: string) => `goal_entry_${groupId}`;

type MyEntry = { id: string; name: string };

export function GoalPage({ groupId }: GoalPageProps) {
  const { locale } = useLocale();
  const [data, setData] = useState<GoalPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimName, setClaimName] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [confirmUncheck, setConfirmUncheck] = useState<{ id: string; name: string } | null>(null);
  const [myEntry, setMyEntry] = useState<MyEntry | null>(null);

  const loadData = useCallback(async () => {
    const result = await getGoalPageData(groupId);
    setData(result);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    // Restore my entry from localStorage
    const saved = localStorage.getItem(storageKey(groupId));
    if (saved) {
      try {
        setMyEntry(JSON.parse(saved));
      } catch {
        localStorage.removeItem(storageKey(groupId));
      }
    }
    loadData();
  }, [groupId, loadData]);

  // If my saved entry was deleted by admin, clear localStorage
  useEffect(() => {
    if (!data || !myEntry) return;
    const stillExists = data.entries.some((e) => e.id === myEntry.id);
    if (!stillExists) {
      localStorage.removeItem(storageKey(groupId));
      setMyEntry(null);
    }
  }, [data, myEntry, groupId]);

  if (loading || !data) {
    return (
      <>
        <NavBar />
        <div className="max-w-md mx-auto px-4 pb-4 space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-muted rounded-md" />
          <div className="h-4 w-64 bg-muted rounded-md" />
          <div className="h-12 w-full bg-muted rounded-lg" />
          <div className="h-4 w-32 bg-muted rounded-md" />
          <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="px-3 py-3 border-b border-foreground/5">
                <div className="h-4 w-28 bg-muted rounded-md" />
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
    if (result.success && result.entry) {
      const newEntry = { id: result.entry.id, name: result.entry.name };
      localStorage.setItem(storageKey(groupId), JSON.stringify(newEntry));
      setMyEntry(newEntry);
      setClaimName("");
      setShowInput(false);
      fireConfetti();
      await loadData();
    }
    setClaiming(false);
  };

  const performToggle = async (entryId: string, wasCompleted: boolean) => {
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

  const handleRowClick = (entry: { id: string; name: string; completed: boolean }) => {
    // Only allow interaction with my own entry
    if (!myEntry || entry.id !== myEntry.id) return;

    // Marking as done: do it immediately
    if (!entry.completed) {
      performToggle(entry.id, false);
      return;
    }
    // Un-checking: show confirmation first
    setConfirmUncheck({ id: entry.id, name: entry.name });
  };

  const confirmUncheckYes = () => {
    if (!confirmUncheck) return;
    performToggle(confirmUncheck.id, true);
    setConfirmUncheck(null);
  };

  const handleChangeName = () => {
    // Forget the current entry on this device so a new name can be set.
    // The existing DB entry stays untouched; only an admin can delete it.
    localStorage.removeItem(storageKey(groupId));
    setMyEntry(null);
  };

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
      </div>

      {/* My entry card / Register button */}
      {myEntry ? (
        <div className="rounded-xl border border-foreground/10 bg-card p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">
              {locale === "ar" ? "مسجّلة باسم" : "Registered as"}
            </div>
            <div className="font-medium">{myEntry.name}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleChangeName}
            className="cursor-pointer gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            {locale === "ar" ? "تغيير" : "Change"}
          </Button>
        </div>
      ) : (
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
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry, i) => {
                const isMine = myEntry?.id === entry.id;
                return (
                  <tr
                    key={entry.id}
                    className={`
                      transition-colors
                      ${entry.completed ? "bg-blue-50 dark:bg-blue-950/20" : "bg-card"}
                      ${isMine ? "cursor-pointer hover:bg-muted/30 ring-1 ring-inset ring-[#1B3A6B]/20" : "cursor-default"}
                      ${i < data.entries.length - 1 ? "border-b border-foreground/5" : ""}
                    `}
                    onClick={() => handleRowClick(entry)}
                  >
                    <td className="px-3 py-2.5 flex items-center gap-2">
                      {entry.completed && (
                        <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      )}
                      <span className={entry.completed ? "text-blue-700 dark:text-blue-300" : ""}>
                        {entry.name}
                      </span>
                      {isMine && (
                        <span className="text-[10px] text-muted-foreground ms-auto">
                          {locale === "ar" ? "(أنتِ)" : "(you)"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* Confirm un-check dialog */}
    <Dialog open={confirmUncheck !== null} onOpenChange={(open) => !open && setConfirmUncheck(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {locale === "ar" ? "تأكيد الإلغاء" : "Confirm"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            {locale === "ar"
              ? `هل تريدين إلغاء إنجاز "${confirmUncheck?.name}"؟`
              : `Mark "${confirmUncheck?.name}" as not done?`}
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => setConfirmUncheck(null)}
              className="cursor-pointer"
            >
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmUncheckYes}
              className="cursor-pointer"
            >
              {locale === "ar" ? "تأكيد" : "Confirm"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
