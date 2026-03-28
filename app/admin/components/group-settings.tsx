"use client";

import { useState, useRef } from "react";
import { useLocale } from "@/lib/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateGroupAction } from "@/server/actions/admin";
import { uploadBannerAction } from "@/server/actions/banner";
import { Image as ImageIcon, ChevronDown } from "lucide-react";

const PRAYER_OPTIONS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const PRAYER_OPTIONS_AR: Record<string, string> = {
  Fajr: "الفجر",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

const BANNER_WIDTH = 1200;
const BANNER_HEIGHT = 630;

interface GroupSettingsProps {
  groupId: string;
  initialName: string;
  initialResetType: string;
  initialResetValue: string;
  initialSlug: string;
  initialBannerUrl?: string | null;
  onUpdated: () => void;
}

export function GroupSettings({
  groupId,
  initialName,
  initialResetType,
  initialResetValue,
  initialSlug,
  initialBannerUrl,
  onUpdated,
}: GroupSettingsProps) {
  const { locale, t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [resetType, setResetType] = useState(initialResetType);
  const [resetValue, setResetValue] = useState(initialResetType === "prayer" ? initialResetValue : "Maghrib");
  const [fixedTime, setFixedTime] = useState(initialResetType === "fixed" ? initialResetValue : "21:30");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(initialBannerUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    await new Promise((resolve) => { img.onload = resolve; });

    const canvas = document.createElement("canvas");
    canvas.width = BANNER_WIDTH;
    canvas.height = BANNER_HEIGHT;
    const ctx = canvas.getContext("2d")!;

    const scale = Math.max(BANNER_WIDTH / img.width, BANNER_HEIGHT / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (BANNER_WIDTH - w) / 2;
    const y = (BANNER_HEIGHT - h) / 2;
    ctx.drawImage(img, x, y, w, h);

    URL.revokeObjectURL(url);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1];

    const result = await uploadBannerAction(groupId, base64, "image/jpeg");
    if (result.success && result.url) {
      setBannerPreview(result.url);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    const result = await updateGroupAction(groupId, {
      name: name.trim(),
      slug: slug.trim(),
      resetType,
      resetValue: resetType === "fixed" ? fixedTime : resetValue,
    });

    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onUpdated();
    } else {
      setError(result.error ?? "Error");
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardContent className="py-3">
        <button
          className="flex items-center justify-between w-full cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-sm font-medium">
            {locale === "ar" ? "إعدادات المجموعة" : "Group Settings"}
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded && (
          <div className="space-y-4 pt-4">
            {/* Banner upload */}
            <div className="space-y-2">
              <Label>{locale === "ar" ? "صورة الغلاف" : "Banner"}</Label>
              <div
                className="relative w-full rounded-lg border-2 border-dashed border-input overflow-hidden cursor-pointer hover:border-muted-foreground/50 transition-colors"
                style={{ aspectRatio: `${BANNER_WIDTH}/${BANNER_HEIGHT}` }}
                onClick={() => fileInputRef.current?.click()}
              >
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-xs">
                      {uploading ? "..." : locale === "ar" ? "اضغطي لرفع صورة" : "Click to upload"}
                    </span>
                  </div>
                )}
                {uploading && bannerPreview && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <span className="text-sm">...</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerSelect} />
            </div>

            <div className="space-y-2">
              <Label>{locale === "ar" ? "اسم المجموعة" : "Group Name"}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{locale === "ar" ? "الرابط" : "Slug"}</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} dir="ltr" />
            </div>

            <div className="space-y-2">
              <Label>{locale === "ar" ? "وقت التجديد" : "Reset Time"}</Label>
              <div className="flex gap-2">
                <Button
                  variant={resetType === "prayer" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 cursor-pointer"
                  onClick={() => setResetType("prayer")}
                >
                  {locale === "ar" ? "وقت صلاة" : "Prayer"}
                </Button>
                <Button
                  variant={resetType === "fixed" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 cursor-pointer"
                  onClick={() => setResetType("fixed")}
                >
                  {locale === "ar" ? "وقت ثابت" : "Fixed"}
                </Button>
              </div>

              {resetType === "prayer" ? (
                <select
                  value={resetValue}
                  onChange={(e) => setResetValue(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {PRAYER_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {locale === "ar" ? PRAYER_OPTIONS_AR[p] : p}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type="time"
                  value={fixedTime}
                  onChange={(e) => setFixedTime(e.target.value)}
                  dir="ltr"
                />
              )}
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#1B3A6B] text-white hover:bg-[#152E55] dark:bg-[#1E4080] dark:hover:bg-[#16326A] cursor-pointer"
            >
              {saving ? "..." : saved ? (locale === "ar" ? "تم الحفظ" : "Saved") : t("save")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
