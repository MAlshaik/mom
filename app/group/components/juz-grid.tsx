"use client";

import { useLocale } from "@/lib/locale-context";
import type { MockSlot } from "@/lib/mock-data";

interface JuzGridProps {
  slots: MockSlot[];
  currentMemberId: string;
  onSlotTap: (slot: MockSlot) => void;
}

export function JuzGrid({ slots, currentMemberId, onSlotTap }: JuzGridProps) {
  const { t } = useLocale();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>{t("done")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
          <span>{t("undone")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-200 dark:bg-amber-800/40" />
          <span>{t("unassigned")}</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {slots.map((slot) => {
          const isMine = slot.member?.id === currentMemberId;
          const isDone = slot.completed;
          const isAssigned = slot.member !== null;
          // Tappable if: unassigned, or user's own slot
          const isTappable = !isAssigned || isMine;

          return (
            <button
              key={slot.juz}
              type="button"
              disabled={!isTappable}
              onClick={() => isTappable && onSlotTap(slot)}
              className={`
                rounded-lg p-2.5 text-center transition-all
                ${!isAssigned
                  ? "bg-amber-100 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/30"
                  : isDone
                    ? "bg-blue-200 dark:bg-blue-900/40"
                    : "bg-muted"
                }
                ${isMine && isDone
                  ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-background"
                  : isMine
                    ? "ring-2 ring-blue-500/40 ring-offset-1 ring-offset-background"
                    : isAssigned ? "opacity-60" : "opacity-50"
                }
                ${isTappable ? "cursor-pointer active:scale-95" : "cursor-default"}
              `}
            >
              <div className={`text-base font-bold tabular-nums ${
                !isAssigned
                  ? "text-amber-600 dark:text-amber-400"
                  : isDone
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-foreground"
              }`}>
                {slot.juz}
              </div>
              <div className={`text-xs leading-snug line-clamp-2 mt-1 min-h-[2em] font-medium ${
                !isAssigned
                  ? "text-amber-500/60 dark:text-amber-500/40"
                  : "text-foreground/70 dark:text-foreground/60"
              }`}>
                {slot.member?.name ?? "—"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
