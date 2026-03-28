"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { t } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const success = await login(code.trim());
    if (!success) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
    setSubmitting(false);
  };

  return (
    <Card className="w-full max-w-xs mx-auto shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-muted-foreground text-center">
            {t("enterCode")}
          </label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="A3"
            className={`text-center text-lg tracking-widest h-12 ${
              error ? "border-destructive" : ""
            }`}
            dir="ltr"
            autoFocus
          />
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 text-base bg-[#1B3A6B] text-white hover:bg-[#152E55] dark:bg-[#1E4080] dark:hover:bg-[#16326A]"
          >
            {submitting ? "..." : t("login")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
