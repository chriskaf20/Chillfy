"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

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
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const loading = status === "loading";

  const refreshUser = async () => {
    if (session?.user?.email) {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  useEffect(() => {
    if (session?.user) {
      const userData: User = {
        id: (session.user as any).id || session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        role: (session.user as any).role || 'attendee',
        image: session.user.image || undefined,
      };
      setUser(userData);
    } else {
      setUser(null);
    }
  }, [session]);

  const login = () => signIn("email");
  const logout = () => {
    setUser(null);
    signOut({ callbackUrl: "/" });
  };

  const isAdmin = user?.role === 'admin';
  const isAttendee = user?.role === 'attendee';

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
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

// Hook for admin-only access
export function useRequireAdmin() {
  const { user, isAdmin, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      window.location.href = '/auth/signin';
    }
  }, [user, isAdmin, loading]);

  return { user, isAdmin, loading };
}

// Hook for protected routes (any authenticated user)
export function useRequireAuth() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth/signin';
    }
  }, [user, loading]);

  return { user, loading };
}