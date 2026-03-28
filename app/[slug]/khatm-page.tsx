"use client";

import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { LoginScreen } from "@/app/group/components/login-card";
import { GroupView } from "@/app/group/components/group-view";

interface KhatmPageProps {
  groupId: string;
  groupName: string;
  bannerUrl: string | null;
}

export function KhatmPage({ groupId, groupName, bannerUrl }: KhatmPageProps) {
  const { member } = useAuth();
  const { locale } = useLocale();

  if (!member) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={groupName}
            className="w-full rounded-lg object-cover"
            style={{ aspectRatio: "1200/630" }}
          />
        ) : (
          <div
            className="w-full rounded-lg bg-gradient-to-br from-[#1B3A6B] to-[#2C5F8A] flex items-center justify-center"
            style={{ aspectRatio: "1200/630" }}
          >
            <span className="text-white/80 text-3xl font-bold">{groupName}</span>
          </div>
        )}
        <LoginScreen />
      </div>
    );
  }

  return (
    <div>
      {bannerUrl && (
        <div className="max-w-md mx-auto px-4 pt-4">
          <img
            src={bannerUrl}
            alt={groupName}
            className="w-full rounded-lg object-cover"
            style={{ aspectRatio: "1200/630" }}
          />
        </div>
      )}
      <GroupView />
    </div>
  );
}
