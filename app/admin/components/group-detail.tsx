"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/lib/locale-context";
import { WhatsAppReport } from "./whatsapp-report";
import { MemberListReal } from "./member-list-real";
import {
  getGroupMembersAction,
  addMemberAction,
  updateMemberAction,
  removeMemberAction,
} from "@/server/actions/admin";

export interface MemberInfo {
  id: string;
  name: string;
  code: string;
  startingJuz: number;
  isAdmin: boolean;
}

interface GroupDetailProps {
  groupId: string;
}

export function GroupDetail({ groupId }: GroupDetailProps) {
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMembers = useCallback(async () => {
    const data = await getGroupMembersAction(groupId);
    setMembers(data);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAdd = async (name: string, startingJuz: number) => {
    const result = await addMemberAction({ name, startingJuz, groupId });
    if (result.success) {
      await loadMembers();
      return { success: true, code: result.code! };
    }
    return { success: false, error: result.error };
  };

  const handleUpdate = async (memberId: string, name: string, startingJuz: number) => {
    const result = await updateMemberAction({ memberId, name, startingJuz, groupId });
    if (result.success) {
      await loadMembers();
      return { success: true, code: result.code! };
    }
    return { success: false, error: result.error };
  };

  const handleRemove = async (memberId: string) => {
    await removeMemberAction(memberId);
    await loadMembers();
  };

  if (loading) return <div className="text-center text-muted-foreground text-sm py-8">...</div>;

  return (
    <div className="space-y-6">
      <WhatsAppReport members={members} />
      <MemberListReal
        members={members}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onRemove={handleRemove}
      />
    </div>
  );
}
