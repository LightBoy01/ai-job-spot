
import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../lib/firebase'; // Import auth from the client-side firebase.ts

interface AuthState {
  user: User | null;
  loading: boolean;
  idToken: string | null;
  logout: () => Promise<void>;
}

const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        setUser(firebaseUser);
        setIdToken(token);
      } else {
        setUser(null);
        setIdToken(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    await auth.signOut();
    setUser(null);
    setIdToken(null);
  }, []);

  return { user, loading, idToken, logout };
};

export default useAuth;
