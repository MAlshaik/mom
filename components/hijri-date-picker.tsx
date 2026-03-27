"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

const HIJRI_MONTHS_AR = [
  "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
  "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
  "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
];

const WEEKDAYS_AR = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
const WEEKDAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface MonthData {
  daysInMonth: number;
  firstDayOfWeek: number; // 0=Sunday
}

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

async function getMonthData(year: number, month: number): Promise<MonthData> {
  try {
    const res = await fetch(
      `https://api.aladhan.com/v1/hToG/1-${month}-${year}?timezonestring=Asia/Riyadh`
    );
    const json = await res.json();
    const weekdayName = json.data.gregorian.weekday.en;
    const firstDayOfWeek = WEEKDAY_TO_INDEX[weekdayName] ?? 0;

    // Hijri months alternate 30/29 days (roughly)
    const daysInMonth = month % 2 === 1 ? 30 : 29;

    return { daysInMonth, firstDayOfWeek };
  } catch {
    return { daysInMonth: 30, firstDayOfWeek: 0 };
  }
}

interface HijriDatePickerProps {
  value: string; // "YYYY-MM-DD" hijri
  onChange: (value: string) => void;
  locale?: "ar" | "en";
}

export function HijriDatePicker({ value, onChange, locale = "ar" }: HijriDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(1447);
  const [viewMonth, setViewMonth] = useState(10);
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(false);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m);
      }
    }
  }, []);

  // Fetch month data when view changes
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getMonthData(viewYear, viewMonth).then((data) => {
      setMonthData(data);
      setLoading(false);
    });
  }, [viewYear, viewMonth, open]);

  const weekdays = locale === "ar" ? WEEKDAYS_AR : WEEKDAYS_EN;
  const monthName = HIJRI_MONTHS_AR[viewMonth - 1];

  const handlePrev = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNext = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelect = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(dateStr);
    setOpen(false);
  };

  const selectedParts = value ? value.split("-").map(Number) : [];
  const isSelected = (day: number) =>
    selectedParts[0] === viewYear && selectedParts[1] === viewMonth && selectedParts[2] === day;

  // Format display
  const displayValue = value
    ? `${selectedParts[2]} ${HIJRI_MONTHS_AR[(selectedParts[1] || 1) - 1]} ${selectedParts[0]} هـ`
    : locale === "ar" ? "اختاري التاريخ" : "Select date";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-start cursor-pointer hover:bg-muted/50 transition-colors"
      >
        {displayValue}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg p-3 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleNext} className="h-8 w-8 p-0 cursor-pointer">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              {monthName} {viewYear}
            </div>
            <Button variant="ghost" size="sm" onClick={handlePrev} className="h-8 w-8 p-0 cursor-pointer">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((d) => (
              <div key={d} className="text-[10px] text-muted-foreground font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          {loading || !monthData ? (
            <div className="text-center text-muted-foreground text-xs py-4">...</div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for offset */}
              {Array.from({ length: monthData.firstDayOfWeek }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {/* Day buttons */}
              {Array.from({ length: monthData.daysInMonth }, (_, i) => {
                const day = i + 1;
                const selected = isSelected(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelect(day)}
                    className={`
                      h-8 rounded-md text-sm cursor-pointer transition-colors
                      ${selected
                        ? "bg-[#1B3A6B] text-white"
                        : "hover:bg-muted"
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
