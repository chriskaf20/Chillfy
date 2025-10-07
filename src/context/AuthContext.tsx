
"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { getSupabaseClient } from '@/lib/supabase';

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
  adoptSession: (access_token: string, refresh_token: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [supabase] = useState(() => getSupabaseClient());

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user: supaUser }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error refreshing user:', error);
        setUser(null);
        setLoading(false);
        return;
      }

      if (supaUser) {
        // First, get role from user_metadata
        let userRole: UserRole = supaUser.user_metadata?.role || "attendee";
        
        // Then check profiles table for admin status
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, is_admin')
            .eq('id', supaUser.id)
            .maybeSingle();
            
          if (profile) {
            if (profile.is_admin === true || profile.role === 'admin') {
              userRole = 'admin';
            }
          }
        } catch (profileError) {
          console.warn('Could not fetch user profile for admin check:', profileError);
        }

        setUser({
          id: supaUser.id,
          name: supaUser.user_metadata?.name || "",
          email: supaUser.email || "",
          role: userRole,
          image: supaUser.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
    } catch (error: any) {
      console.error('Unexpected error refreshing user:', error);
      
      setUser(null);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refreshUser();
    
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log('🔄 Auth state change in context:', event);
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await refreshUser();
        }
      }
    );
    
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase, refreshUser]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      await refreshUser();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const adoptSession = async (access_token: string, refresh_token: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        console.error('Failed to adopt session in AuthContext:', error.message);
        throw error;
      }
      
      await refreshUser();
    } catch (error) {
      setLoading(false);
      throw error;
    }
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
    adoptSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};