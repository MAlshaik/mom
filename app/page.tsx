"use client";

import { useAuth } from "@/lib/auth-context";
import { LoginScreen } from "./group/components/login-card";
import { GroupView } from "./group/components/group-view";

export default function Home() {
  const { member } = useAuth();
  return member ? <GroupView /> : <LoginScreen />;
}
