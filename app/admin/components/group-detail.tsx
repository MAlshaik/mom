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
  getTodayCompletionsAction,
  adminMarkDoneAction,
} from "@/server/actions/admin";
import { getGoalPageData, toggleGoalCompletionAction } from "@/server/actions/goals";
import { GoalEntriesAdmin } from "./goal-entries-admin";

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
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [groupInfo, setGroupInfo] = useState<{ name: string; slug: string; type: string; resetType: string; resetValue: string; bannerUrl: string | null } | null>(null);
  const [goalEntries, setGoalEntries] = useState<{ id: string; name: string; completed: boolean; claimedAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const groupsData = await listGroupsAction();
    const g = groupsData.find((g) => g.id === groupId);
    if (g) setGroupInfo({ name: g.name, slug: g.slug, type: g.type, resetType: g.resetType, resetValue: g.resetValue, bannerUrl: g.bannerUrl ?? null });

    if (g?.type === "goal") {
      const goalData = await getGoalPageData(groupId);
      if (goalData) setGoalEntries(goalData.entries);
    } else {
      const [membersData, completions] = await Promise.all([
        getGroupMembersAction(groupId),
        getTodayCompletionsAction(groupId),
      ]);
      setMembers(membersData);
      setCompletedIds(new Set(completions));
    }
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

  const handleMarkDone = async (memberId: string, juzAssignments: number[]) => {
    // Optimistic toggle
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });

    await adminMarkDoneAction(memberId, juzAssignments, groupId);
    // Reload to get accurate state
    const completions = await getTodayCompletionsAction(groupId);
    setCompletedIds(new Set(completions));
  };

  if (loading) return <div className="text-center text-muted-foreground text-sm py-8">...</div>;

  return (
    <div className="space-y-6">
      {groupInfo && (
        <GroupSettings
          groupId={groupId}
          groupType={groupInfo.type}
          initialName={groupInfo.name}
          initialResetType={groupInfo.resetType}
          initialResetValue={groupInfo.resetValue}
          initialSlug={groupInfo.slug}
          initialBannerUrl={groupInfo.bannerUrl}
          onUpdated={loadData}
        />
      )}

      {groupInfo?.type === "goal" ? (
        <GoalEntriesAdmin
          entries={goalEntries}
          onToggle={async (entryId) => {
            await toggleGoalCompletionAction(entryId);
            await loadData();
          }}
        />
      ) : (
        <>
          <WhatsAppReport members={members} completedMemberIds={completedIds} />
          <MemberListReal
            members={members}
            groupId={groupId}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
            onAddJuz={handleAddJuz}
            onRemoveJuz={handleRemoveJuz}
            onMarkDone={handleMarkDone}
            completedMemberIds={completedIds}
          />
        </>
      )}
    </div>
  );
}
