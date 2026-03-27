"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { getGroupPageData, type SlotData } from "@/server/actions/data";
import { toggleEntryAction } from "@/server/actions/entries";
import { Header } from "./header";
import { MissedDays } from "./missed-days";
import { MyJuzCard } from "./my-juz-card";
import { JuzGrid } from "./juz-grid";
import { fireConfetti } from "@/lib/use-confetti";

export function GroupView() {
  const { member } = useAuth();
  const { t } = useLocale();
  const [data, setData] = useState<Awaited<ReturnType<typeof getGroupPageData>>>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const result = await getGroupPageData();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !data || !member) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground text-sm">...</div>
      </div>
    );
  }

  const handleToggleToday = async () => {
    const wasCompleted = data.isTodayCompleted;
    // Optimistic update
    setData((prev) =>
      prev
        ? {
            ...prev,
            isTodayCompleted: !wasCompleted,
            slots: prev.slots.map((s) =>
              s.memberId === member.id ? { ...s, completed: !wasCompleted } : s
            ),
            doneCount: prev.doneCount + (wasCompleted ? -1 : 1),
          }
        : prev
    );
    if (!wasCompleted) fireConfetti();

    const result = await toggleEntryAction(data.khatmDay);
    if (!result.success) {
      // Revert on failure
      loadData();
    }
  };

  const handleRegisterMissed = async (khatmDay: number) => {
    // Optimistic: remove from missed days
    setData((prev) =>
      prev
        ? { ...prev, missedDays: prev.missedDays.filter((d) => d.khatmDay !== khatmDay) }
        : prev
    );
    fireConfetti();

    const result = await toggleEntryAction(khatmDay);
    if (!result.success) {
      loadData();
    }
  };

  const handleSlotTap = async (slot: SlotData) => {
    // Tap unassigned slot — for now just toggle as extra completion
    // (claiming unassigned slots will need a separate server action)
    if (!slot.memberId) return;

    // Tap own slot → toggle completion
    if (slot.memberId === member.id) {
      handleToggleToday();
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      <Header
        hijriDate={data.hijriDate}
        maghribTime={data.maghribTime}
      />

      <MyJuzCard
        juz={data.myJuz}
        completed={data.isTodayCompleted}
        memberName={data.member.name}
        onToggle={handleToggleToday}
      />

      {data.missedDays.length > 0 && (
        <MissedDays
          missedDays={data.missedDays}
          onRegister={handleRegisterMissed}
        />
      )}

      <div className="text-sm text-muted-foreground text-center">
        {t("doneCount")}: {data.doneCount} {t("of")} {data.totalCount}
      </div>

      <JuzGrid
        slots={data.slots.map((s) => ({
          juz: s.juz,
          member: s.memberId ? { id: s.memberId, name: s.memberName ?? "", code: "", startingJuz: 0, isAdmin: false } : null,
          completed: s.completed,
        }))}
        currentMemberId={member.id}
        onSlotTap={(mockSlot) => {
          const realSlot = data.slots.find((s) => s.juz === mockSlot.juz);
          if (realSlot) handleSlotTap(realSlot);
        }}
      />

      <p className="text-xs text-muted-foreground text-center pb-2">
        {t("note")}
      </p>
    </div>
  );
}
