"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const inDemoMode = sessionStorage.getItem('isDemoMode') === 'true';

    if (inDemoMode) {
      console.warn("In Demo Mode. Using a mock user for UI preview.");
      const mockUser = {
        uid: 'mock-user-uid',
        displayName: 'Demo User',
        email: 'demo@example.com',
        photoURL: null,
      } as User;
      setUser(mockUser);
      setLoading(false);
      return; // Exit early, do not set up Firebase listener.
    }

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Firebase is not configured and we're not in demo mode.
      setUser(null);
      setLoading(false);
    }
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-1/2 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
