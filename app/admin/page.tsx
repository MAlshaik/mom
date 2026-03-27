"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/lib/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { listGroupsAction } from "@/server/actions/admin";
import { GroupList } from "./components/group-list";
import { GroupDetail } from "./components/group-detail";

const ADMIN_PASSWORD = "bestmom21";
const ADMIN_STORAGE_KEY = "khatm_admin";

export default function AdminPage() {
  const { locale, t } = useLocale();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const BackArrow = locale === "ar" ? ArrowRight : ArrowLeft;

  useEffect(() => {
    const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (saved === "true") setAuthed(true);
    setLoaded(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toLowerCase() === ADMIN_PASSWORD) {
      setAuthed(true);
      localStorage.setItem(ADMIN_STORAGE_KEY, "true");
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (!loaded) return null;

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <Card className="w-full max-w-xs shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block text-sm text-muted-foreground text-center">
                {t("enterCode")}
              </label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`text-center text-lg h-12 ${
                  error ? "border-destructive" : ""
                }`}
                dir="ltr"
                autoFocus
              />
              <Button
                type="submit"
                className="w-full h-12 text-base bg-[#1B3A6B] text-white hover:bg-[#152E55] dark:bg-[#1E4080] dark:hover:bg-[#16326A]"
              >
                {t("login")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("admin")}</h1>
        {selectedGroupId ? (
          <button
            onClick={() => setSelectedGroupId(null)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <BackArrow className="h-4 w-4" />
            {t("back")}
          </button>
        ) : (
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BackArrow className="h-4 w-4" />
            {t("back")}
          </Link>
        )}
      </div>

      {selectedGroupId ? (
        <GroupDetail groupId={selectedGroupId} />
      ) : (
        <GroupList onSelectGroup={setSelectedGroupId} />
      )}
    </div>
  );
}
