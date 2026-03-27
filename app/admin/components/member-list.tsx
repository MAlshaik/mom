"use client";

import { useState } from "react";
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
import { MOCK_MEMBERS, type MockMember } from "@/lib/mock-data";
import { generateCode as genCode } from "@/lib/arabic-to-english";
import { Plus, Trash2, Pencil, Copy, Check } from "lucide-react";

export function MemberList() {
  const { t } = useLocale();
  const [members, setMembers] = useState<MockMember[]>(MOCK_MEMBERS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MockMember | null>(null);
  const [formName, setFormName] = useState("");
  const [formJuz, setFormJuz] = useState("1");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const generateCode = (name: string, juz: number) => genCode(name, juz);

  const handleAdd = () => {
    setEditingMember(null);
    setCreatedCode(null);
    setCodeCopied(false);
    setFormName("");
    setFormJuz("1");
    setDialogOpen(true);
  };

  const handleEdit = (member: MockMember) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormJuz(String(member.startingJuz));
    setDialogOpen(true);
  };

  const handleSave = () => {
    const juz = parseInt(formJuz, 10);
    if (!formName.trim() || isNaN(juz) || juz < 1 || juz > 30) return;

    const code = generateCode(formName, juz);

    if (editingMember) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
            ? { ...m, name: formName.trim(), startingJuz: juz, code }
            : m
        )
      );
      setDialogOpen(false);
    } else {
      const newMember: MockMember = {
        id: String(Date.now()),
        name: formName.trim(),
        code,
        startingJuz: juz,
        isAdmin: false,
      };
      setMembers((prev) => [...prev, newMember]);
      setCreatedCode(code);
      setCodeCopied(false);
    }
  };

  const handleRemove = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          {t("members")} ({members.length})
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            onClick={handleAdd}
            className="inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium h-9 px-3 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("addMember")}
          </DialogTrigger>
          <DialogContent>
            {createdCode ? (
              <>
                <DialogHeader>
                  <DialogTitle>{t("memberCode")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    {formName.trim()}
                  </p>
                  <div
                    dir="ltr"
                    className="text-3xl font-mono font-bold tracking-widest py-4"
                  >
                    {createdCode}
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={async () => {
                      await navigator.clipboard.writeText(createdCode);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    }}
                  >
                    {codeCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        {t("copied")}
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        {t("copyWhatsApp")}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setDialogOpen(false)}
                  >
                    {t("done")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {editingMember ? t("editMember") : t("addMember")}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>{t("memberName")}</Label>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="فاطمة..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("startingJuz")}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={formJuz}
                      onChange={(e) => setFormJuz(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("memberCode")}:{" "}
                    <span dir="ltr" className="font-mono">
                      {generateCode(formName, parseInt(formJuz, 10) || 1)}
                    </span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      onClick={() => setDialogOpen(false)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button onClick={handleSave} className="bg-[#1B3A6B] text-white hover:bg-[#152E55] dark:bg-[#1E4080] dark:hover:bg-[#16326A]">
                      {t("save")}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{member.name}</div>
                <div className="text-xs text-muted-foreground" dir="ltr">
                  {member.code} · {t("startingJuz")}: {member.startingJuz}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleEdit(member)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(member.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
