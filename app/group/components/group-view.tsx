"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { getGroupPageData, type SlotData } from "@/server/actions/data";
import { toggleAllJuzAction, toggleSingleJuzAction, adminToggleEntryAction } from "@/server/actions/entries";
import { Header } from "./header";
import { MissedDays } from "./missed-days";
import { MyJuzCard } from "./my-juz-card";
import { JuzGrid } from "./juz-grid";
import { fireConfetti } from "@/lib/use-confetti";
import { NavBar } from "@/components/nav-bar";

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
      <>
        <NavBar />
        <div className="max-w-md mx-auto px-4 pb-4 space-y-4 animate-pulse">
          <div className="text-center space-y-3 pb-2">
            <div className="h-7 w-48 bg-muted rounded-md mx-auto" />
            <div className="h-4 w-56 bg-muted rounded-md mx-auto" />
            <div className="h-3 w-36 bg-muted rounded-md mx-auto" />
            <div className="h-4 w-40 bg-muted rounded-md mx-auto" />
          </div>
          <div className="rounded-xl border p-6 space-y-4">
            <div className="h-4 w-24 bg-muted rounded-md mx-auto" />
            <div className="h-12 w-16 bg-muted rounded-md mx-auto" />
            <div className="h-12 w-full bg-muted rounded-lg" />
          </div>
          <div className="h-4 w-32 bg-muted rounded-md mx-auto" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} className="rounded-lg p-2.5 bg-muted h-16" />
            ))}
          </div>
        </div>
      </>
    );
  }

  // Big button: toggle all juz at once
  const handleToggleAll = async () => {
    const wasAllDone = data.allMyJuzCompleted;
    // Optimistic
    setData((prev) =>
      prev
        ? {
            ...prev,
            allMyJuzCompleted: !wasAllDone,
            myJuzSlots: prev.myJuzSlots.map((s) => ({ ...s, completed: !wasAllDone })),
            slots: prev.slots.map((s) =>
              s.memberId === member.id ? { ...s, completed: !wasAllDone } : s
            ),
            doneCount: prev.doneCount + (wasAllDone ? -prev.myJuzSlots.filter((s) => s.completed).length : prev.myJuzSlots.filter((s) => !s.completed).length),
          }
        : prev
    );
    if (!wasAllDone) fireConfetti();

    const result = await toggleAllJuzAction(data.khatmDay, data.hijriMonth, data.hijriYear);
    if (!result.success) loadData();
  };

  // Grid tap: toggle a single slot
  const handleSlotTap = async (slot: SlotData) => {
    if (!slot.memberId || slot.startingJuz === null) return;

    const isMySlot = slot.memberId === member.id;
    const wasCompleted = slot.completed;

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      const newSlots = prev.slots.map((s) =>
        s.juz === slot.juz ? { ...s, completed: !wasCompleted } : s
      );
      const newMyJuzSlots = isMySlot
        ? prev.myJuzSlots.map((s) =>
            s.startingJuz === slot.startingJuz ? { ...s, completed: !wasCompleted } : s
          )
        : prev.myJuzSlots;
      return {
        ...prev,
        slots: newSlots,
        myJuzSlots: newMyJuzSlots,
        allMyJuzCompleted: newMyJuzSlots.every((s) => s.completed),
        doneCount: prev.doneCount + (wasCompleted ? -1 : 1),
      };
    });
    if (!wasCompleted) fireConfetti();

    if (isMySlot) {
      const result = await toggleSingleJuzAction(data.khatmDay, slot.startingJuz, data.hijriMonth, data.hijriYear);
      if (!result.success) loadData();
    } else if (data.member.isAdmin) {
      const result = await adminToggleEntryAction(slot.memberId, data.khatmDay, slot.startingJuz, data.hijriMonth, data.hijriYear);
      if (!result.success) loadData();
    }
  };

  // Missed days: register all juz for that day
  const handleRegisterMissed = async (khatmDay: number) => {
    setData((prev) =>
      prev
        ? { ...prev, missedDays: prev.missedDays.filter((d) => d.khatmDay !== khatmDay) }
        : prev
    );
    fireConfetti();

    const result = await toggleAllJuzAction(khatmDay, data.hijriMonth, data.hijriYear);
    if (!result.success) loadData();
  };

  const juzDisplay = data.myJuzSlots.map((s) => s.juz).join(", ");

  return (
    <>
      <NavBar />
      <div className="max-w-md mx-auto px-4 pb-4 space-y-4">
      <Header
        groupName={data.groupName}
        hijriDate={data.hijriDate}
        maghribTime={data.resetTime}
        resetLabel={data.resetLabel}
      />

      <MyJuzCard
        juzDisplay={juzDisplay}
        completed={data.allMyJuzCompleted}
        memberName={data.member.name}
        onToggle={handleToggleAll}
      />

      {data.missedDays.length > 0 && (
        <MissedDays
          missedDays={data.missedDays.map((d) => ({
            khatmDay: d.khatmDay,
            juzDisplay: d.juzList.map((j) => j.juz).join(", "),
          }))}
          onRegister={handleRegisterMissed}
        />
      )}

      <div className="text-sm text-muted-foreground text-center">
        {t("doneCount")}: {data.doneCount} {t("of")} {data.totalCount}
      </div>

      <JuzGrid
        slots={data.slots.map((s) => ({
          juz: s.juz,
          juzLabel: s.juzLabel,
          member: s.memberId ? { id: s.memberId, name: s.memberName ?? "", code: "", startingJuz: 0, isAdmin: false } : null,
          completed: s.completed,
        }))}
        currentMemberId={member.id}
        isAdmin={data.member.isAdmin}
        onSlotTap={(mockSlot) => {
          const realSlot = data.slots.find((s) => s.juz === mockSlot.juz);
          if (realSlot) handleSlotTap(realSlot);
        }}
      />

      <p className="text-xs text-muted-foreground text-center pb-2">
        {t("note")}
      </p>
    </div>
    </>
  );
}
