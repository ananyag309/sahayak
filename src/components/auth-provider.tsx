
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

// Define a shape for the guest user object
const guestUser: User = {
  uid: 'demo-user',
  displayName: 'Guest User',
  email: 'guest@sahayak.ai',
  photoURL: null,
  emailVerified: true,
  isAnonymous: true,
  metadata: {},
  providerData: [],
  providerId: 'guest',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => '',
  getIdTokenResult: async () => ({} as any),
  reload: async () => {},
  toJSON: () => ({}),
};


interface AuthContextType {
  user: User | null;
  loading: boolean;
  setGuestMode: (isGuest: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setGuestMode: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const setGuestMode = (isGuest: boolean) => {
    if (isGuest) {
      setUser(guestUser);
      router.push('/dashboard');
    } else {
      setUser(null);
      router.push('/login');
    }
  };

  useEffect(() => {
    // If firebase is not configured, don't attempt to authenticate.
    // The login/signup pages will show a warning and offer guest mode.
    if (!isFirebaseConfigured) {
      // Check if user is already a guest from a previous interaction
      if (user?.uid !== 'demo-user') {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      // Don't overwrite the guest user if they are navigating
      if (user?.uid === 'demo-user' && authUser) {
          // A real user logged in, so we can clear the guest user
      } else if (user?.uid === 'demo-user') {
          setLoading(false);
          return;
      }
      
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, pathname]);


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
    <AuthContext.Provider value={{ user, loading, setGuestMode }}>
      {children}
    </AuthContext.Provider>
  );
}
