import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

type AuthContextType = {
  user: null | { name: string; email: string };
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [user, setUser] = useState<AuthContextType["user"]>(null);

  useEffect(() => {
    if (session?.user) {
      setUser({ name: session.user.name ?? "", email: session.user.email ?? "" });
    } else {
      setUser(null);
    }
  }, [session]);

  const login = () => signIn("google");
  const logout = () => signOut();

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}