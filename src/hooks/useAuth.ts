import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../lib/firebase'; // Import auth from the client-side firebase.ts

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean; // New state for admin status
  logout: () => Promise<void>;
}

const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // Default to false

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Get the full token result to access custom claims
        const idTokenResult = await firebaseUser.getIdTokenResult();
        setUser(firebaseUser);
        // Check for the admin custom claim
        setIsAdmin(idTokenResult.claims.admin === true);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    await auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }, []);

  return { user, loading, isAdmin, logout };
};

export default useAuth;
