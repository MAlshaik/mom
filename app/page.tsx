"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale } from "@/lib/locale-context";
import { Input } from "@/components/ui/input";
import { listGroupsAction } from "@/server/actions/admin";
import Link from "next/link";
import { Users, BookOpen, Search } from "lucide-react";

interface GroupInfo {
  id: string;
  name: string;
  slug: string;
  type: string;
  memberCount: number;
  bannerUrl: string | null;
}

// Islamic-themed gradient pairs
const GRADIENTS = [
  "bg-gradient-to-br from-[#1B3A6B] to-[#0F2847]",
  "bg-gradient-to-br from-[#1a4731] to-[#0d2a1c]",
  "bg-gradient-to-br from-[#4a1942] to-[#2a0e26]",
  "bg-gradient-to-br from-[#1e3a5f] to-[#0c1f33]",
  "bg-gradient-to-br from-[#3b1b4a] to-[#1f0e28]",
  "bg-gradient-to-br from-[#2d4a3e] to-[#162620]",
  "bg-gradient-to-br from-[#3d2c1e] to-[#1f1610]",
  "bg-gradient-to-br from-[#1e293b] to-[#0f1520]",
];

function seededIndex(str: string, max: number) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % max;
}

function GroupDirectory() {
  const { locale } = useLocale();
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listGroupsAction().then((data) => {
      setGroups(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.trim().toLowerCase();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.slug.toLowerCase().includes(q)
    );
  }, [groups, search]);

  if (loading) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {locale === "ar" ? "ختم القرآن" : "Khatm Al-Quran"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ar" ? "اختاري مجموعتك" : "Choose your group"}
        </p>
      </div>

      {groups.length > 1 && (
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === "ar" ? "ابحثي..." : "Search..."}
            className="ps-9 h-10"
          />
        </div>
      )}

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {locale === "ar" ? "لا توجد مجموعات بعد." : "No groups yet."}
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {locale === "ar" ? "لا نتائج." : "No results."}
        </p>
      ) : (
        <div className={`grid gap-3 ${filtered.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {filtered.map((group) => {
            const gradientClass = GRADIENTS[seededIndex(group.id, GRADIENTS.length)];

            return (
              <Link key={group.id} href={`/${group.slug}`}>
                <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 hover:ring-2 hover:ring-[#1B3A6B]/40 transition-all cursor-pointer">
                  {/* Banner area */}
                  <div
                    className={`w-full ${group.bannerUrl ? "" : gradientClass}`}
                    style={{ aspectRatio: "1200/630" }}
                  >
                    {group.bannerUrl ? (
                      <img
                        src={group.bannerUrl}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>

                  {/* Info */}
                  <div className="bg-card px-3 py-3">
                    <div className="font-semibold text-base flex items-center gap-1.5 leading-tight">
                      {group.type === "goal" && <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      <span className="truncate">{group.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3" />
                      <span>{group.memberCount} {locale === "ar" ? "عضو" : "members"}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return <GroupDirectory />;
}
