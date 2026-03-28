"use client";

import { useLocale } from "@/lib/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MyJuzCardProps {
  juzDisplay: string;
  completed: boolean;
  memberName: string;
  onToggle: () => void;
}

export function MyJuzCard({ juzDisplay, completed, onToggle }: MyJuzCardProps) {
  const { t } = useLocale();

  return (
    <Card
      className={`transition-all ${
        completed
          ? "border-blue-500/30 bg-blue-50 dark:bg-blue-950/20"
          : ""
      }`}
    >
      <CardContent className="pt-6 text-center space-y-4">
        <div className="text-sm text-muted-foreground">{t("yourJuzToday")}</div>
        <div className="text-5xl font-bold tabular-nums">
          {juzDisplay}
        </div>

        {completed ? (
          <div className="space-y-3">
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {t("completedAlhamdulillah")}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onToggle}
            >
              {t("undo")}
            </Button>
          </div>
        ) : (
          <Button
            onClick={onToggle}
            size="lg"
            className="w-full text-base py-6 bg-[#1B3A6B] text-white hover:bg-[#152E55] dark:bg-[#1E4080] dark:hover:bg-[#16326A]"
          >
            {t("completed")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
