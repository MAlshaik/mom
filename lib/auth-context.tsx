"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { loginAction, logoutAction } from "@/server/actions/auth";

const STORAGE_KEY = "khatm_code";

export interface MemberData {
  id: string;
  name: string;
  code: string;
  startingJuz: number;
  isAdmin: boolean;
  groupId: string;
}

interface AuthContextValue {
  member: MemberData | null;
  loading: boolean;
  login: (code: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<MemberData | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      // Try to log in with the saved code via server action
      loginAction(saved).then((result) => {
        if (result.success) {
          setMember(result.member);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
        setLoaded(true);
      });
    } else {
      setLoaded(true);
    }
  }, []);

  const login = useCallback(async (code: string) => {
    const result = await loginAction(code);
    if (result.success) {
      setMember(result.member);
      localStorage.setItem(STORAGE_KEY, result.member.code);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setMember(null);
    localStorage.removeItem(STORAGE_KEY);
    logoutAction();
  }, []);

  if (!loaded) return null;

  return (
    <AuthContext.Provider value={{ member, loading: !loaded, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
