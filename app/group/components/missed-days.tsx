"use client";

import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MissedDay {
  khatmDay: number;
  juz: number;
}

interface MissedDaysProps {
  missedDays: MissedDay[];
  onRegister: (khatmDay: number) => void;
}

export function MissedDays({ missedDays, onRegister }: MissedDaysProps) {
  const { t } = useLocale();

  return (
    <Card className="border-destructive/20">
      <CardContent className="pt-4 space-y-3">
        <div className="text-sm font-medium text-destructive">
          {t("missedDays")}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {missedDays.map((day) => (
            <Button
              key={day.khatmDay}
              variant="outline"
              className="flex-shrink-0 h-auto py-2 px-4 flex flex-col gap-0.5 border-red-300 dark:border-red-700 hover:bg-red-100 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-900/30 dark:hover:text-red-300 dark:hover:border-red-700"
              onClick={() => onRegister(day.khatmDay)}
            >
              <span className="text-xs text-muted-foreground group-hover:text-white">
                {t("juz")} {day.juz}
              </span>
              <span className="text-xs font-medium">
                {t("register")}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
