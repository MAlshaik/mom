"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/lib/locale-context";
import { WhatsAppReport } from "./whatsapp-report";
import { MemberListReal } from "./member-list-real";
import { GroupSettings } from "./group-settings";
import {
  getGroupMembersAction,
  addMemberAction,
  addJuzToMemberAction,
  removeJuzFromMemberAction,
  updateMemberAction,
  removeMemberAction,
  listGroupsAction,
} from "@/server/actions/admin";

export interface MemberInfo {
  id: string;
  name: string;
  code: string;
  startingJuz: number;
  juzAssignments: number[];
  isAdmin: boolean;
}

interface GroupDetailProps {
  groupId: string;
}

export function GroupDetail({ groupId }: GroupDetailProps) {
  const { locale } = useLocale();
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [groupInfo, setGroupInfo] = useState<{ name: string; slug: string; resetType: string; resetValue: string; bannerUrl: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [membersData, groupsData] = await Promise.all([
      getGroupMembersAction(groupId),
      listGroupsAction(),
    ]);
    setMembers(membersData);
    const g = groupsData.find((g) => g.id === groupId);
    if (g) setGroupInfo({ name: g.name, slug: g.slug, resetType: g.resetType, resetValue: g.resetValue, bannerUrl: g.bannerUrl ?? null });
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = async (name: string, startingJuz: number) => {
    const result = await addMemberAction({ name, startingJuz, groupId });
    if (result.success) {
      await loadData();
      return { success: true, code: result.code! };
    }
    return { success: false, error: result.error };
  };

  const handleUpdate = async (memberId: string, name: string, startingJuz: number, code?: string) => {
    const result = await updateMemberAction({ memberId, name, startingJuz, groupId, code });
    if (result.success) {
      await loadData();
      return { success: true, code: result.code! };
    }
    return { success: false, error: result.error };
  };

  const handleAddJuz = async (memberId: string, juz: number) => {
    const result = await addJuzToMemberAction({ memberId, startingJuz: juz, groupId });
    if (result.success) {
      await loadData();
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const handleRemoveJuz = async (memberId: string, juz: number) => {
    await removeJuzFromMemberAction({ memberId, startingJuz: juz, groupId });
    await loadData();
  };

  const handleRemove = async (memberId: string) => {
    await removeMemberAction(memberId);
    await loadData();
  };

  if (loading) return <div className="text-center text-muted-foreground text-sm py-8">...</div>;

  return (
    <div className="space-y-6">
      {groupInfo && (
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{groupInfo.name}</h2>
          <GroupSettings
            groupId={groupId}
            initialName={groupInfo.name}
            initialResetType={groupInfo.resetType}
            initialResetValue={groupInfo.resetValue}
            initialSlug={groupInfo.slug}
            initialBannerUrl={groupInfo.bannerUrl}
            onUpdated={loadData}
          />
        </div>
      )}

      <WhatsAppReport members={members} />
      <MemberListReal
        members={members}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onRemove={handleRemove}
        onAddJuz={handleAddJuz}
        onRemoveJuz={handleRemoveJuz}
      />
    </div>
  );
}
