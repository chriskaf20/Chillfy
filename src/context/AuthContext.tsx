
"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabaseClient } from "@/lib/supabase";
// Helper hook to use AuthContext
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

type UserRole = 'admin' | 'attendee';

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isAttendee: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = supabaseClient();

  const refreshUser = async () => {
    setLoading(true);
    const {
      data: { user: supaUser },
      error,
    } = await supabase.auth.getUser();
    if (supaUser) {
      setUser({
        id: supaUser.id,
        name: supaUser.user_metadata?.name || "",
        email: supaUser.email || "",
        role: supaUser.user_metadata?.role || "attendee",
        image: supaUser.user_metadata?.avatar_url,
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: string, _session: any) => {
        refreshUser();
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await refreshUser();
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  const isAdmin = user?.role === "admin";
  const isAttendee = user?.role === "attendee";

  const value = {
    user,
    loading,
    isAdmin,
    isAttendee,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};