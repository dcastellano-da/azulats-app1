'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { clearTokenCookie, setTokenCookie } from "@/lib/firebase/auth";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  rol: "Super Administrador" | "Reclutador";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = [
  "dcastellano@digitalagil.com",
  "admin@digitalagil.com"
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email;
        const isSysAdmin = email ? (
          ADMIN_EMAILS.includes(email) || 
          email.endsWith("@digitalagil.com") || 
          email.endsWith("@digitalagil.es")
        ) : false;
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          rol: isSysAdmin ? "Super Administrador" : "Reclutador"
        });

        try {
          const freshToken = await firebaseUser.getIdToken();
          setTokenCookie(freshToken);
        } catch (error) {
          console.error("Error setting token after auth state change:", error);
        }
      } else {
        setUser(null);
        clearTokenCookie();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setUser(null);
    clearTokenCookie();
    if (auth) {
      try {
        const { signOutUser } = await import("@/lib/firebase/auth");
        await signOutUser();
      } catch (e) {
        console.error("Error during firebase logout:", e);
      }
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
