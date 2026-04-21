"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/lib/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { listGroupsAction, createGroupAction, deleteGroupAction } from "@/server/actions/admin";
import { Plus, Trash2, Users, BookOpen } from "lucide-react";
import { HijriDatePicker } from "@/components/hijri-date-picker";

interface GroupInfo {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string;
  country: string;
  startDate: string;
  memberCount: number;
}

interface GroupListProps {
  onSelectGroup: (groupId: string) => void;
}

async function hijriToGregorian(hijriDate: string): Promise<string> {
  try {
    const [y, m, d] = hijriDate.split("-");
    const res = await fetch(
      `https://api.aladhan.com/v1/hToG/${d}-${m}-${y}?timezonestring=Asia/Riyadh`
    );
    const json = await res.json();
    const g = json.data.gregorian;
    const month = String(g.month.number ?? g.month).padStart(2, "0");
    const day = String(g.day).padStart(2, "0");
    return `${g.year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

export function GroupList({ onSelectGroup }: GroupListProps) {
  const { locale, t } = useLocale();
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [groupType, setGroupType] = useState<"khatm" | "goal">("khatm");
  const [formName, setFormName] = useState("");
  const [hijriDate, setHijriDate] = useState("1447-10-01");
  // Goal fields
  const [goalDesc, setGoalDesc] = useState("");

  const loadGroups = async () => {
    const data = await listGroupsAction();
    setGroups(data);
    setLoading(false);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSaving(true);

    // Goal groups don't need dates — default to today
    const gregorianDate =
      groupType === "goal"
        ? new Date().toISOString().split("T")[0]
        : await hijriToGregorian(hijriDate);

    await createGroupAction({
      name: formName.trim(),
      startDate: gregorianDate,
      type: groupType,
      goalDescription: groupType === "goal" ? goalDesc : undefined,
    });

    setDialogOpen(false);
    setFormName("");
    setGoalDesc("");
    setSaving(false);
    loadGroups();
  };

  const handleDelete = async (groupId: string) => {
    await deleteGroupAction(groupId);
    loadGroups();
  };

  if (loading) return <div className="text-center text-muted-foreground text-sm py-8">...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          {locale === "ar" ? "المجموعات" : "Groups"} ({groups.length})
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            className="inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium h-9 px-3 bg-[#1B3A6B] text-white hover:bg-[#152E55] dark:bg-[#1E4080] dark:hover:bg-[#16326A] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            {locale === "ar" ? "مجموعة جديدة" : "New Group"}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{locale === "ar" ? "مجموعة جديدة" : "New Group"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Type selector */}
              <div className="flex gap-2">
                <Button
                  variant={groupType === "khatm" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 cursor-pointer"
                  onClick={() => setGroupType("khatm")}
                >
                  {locale === "ar" ? "ختمة قرآن" : "Quran Khatm"}
                </Button>
                <Button
                  variant={groupType === "goal" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 cursor-pointer"
                  onClick={() => setGroupType("goal")}
                >
                  {locale === "ar" ? "هدف مفتوح" : "Open Goal"}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>{locale === "ar" ? "اسم المجموعة" : "Group Name"}</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={groupType === "khatm"
                    ? (locale === "ar" ? "ختم المهدوي..." : "Khatm Al-Mahdawi...")
                    : (locale === "ar" ? "قراءة سورة يس..." : "Read Surah Yasin...")}
                />
              </div>

              {groupType === "goal" && (
                <div className="space-y-2">
                  <Label>{locale === "ar" ? "الوصف" : "Description"}</Label>
                  <Input
                    value={goalDesc}
                    onChange={(e) => setGoalDesc(e.target.value)}
                    placeholder={locale === "ar" ? "قراءة سورة يس مرة واحدة" : "Read Surah Yasin once"}
                  />
                </div>
              )}

              {groupType === "khatm" && (
                <div className="space-y-2">
                  <Label>{locale === "ar" ? "تاريخ البداية (هجري)" : "Start Date (Hijri)"}</Label>
                  <HijriDatePicker
                    value={hijriDate}
                    onChange={(v) => setHijriDate(v)}
                    locale={locale}
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer">
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={saving}
                  className="bg-[#1B3A6B] text-white hover:bg-[#152E55] dark:bg-[#1E4080] dark:hover:bg-[#16326A] cursor-pointer"
                >
                  {saving ? "..." : t("save")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            {locale === "ar" ? "لا توجد مجموعات بعد. أنشئي مجموعة جديدة." : "No groups yet. Create a new group."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <Card key={group.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onSelectGroup(group.id)}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm flex items-center gap-1.5">
                    {group.type === "goal" && <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />}
                    {group.name}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {group.memberCount}
                    </span>
                    <span className="text-muted-foreground/50" dir="ltr">/{group.slug}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(group.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
