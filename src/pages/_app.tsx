import '../styles/globals.css';
import type { AppProps } from 'next/app';

import { Analytics } from '@vercel/analytics/next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { app } from '../lib/firebase';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const auth = getAuth(app);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && router.pathname.startsWith('/admin') && router.pathname !== '/admin/login') {
        router.push('/admin/login');
      } else if (user && router.pathname === '/admin/login') {
        router.push('/admin');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router.pathname, auth, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-charcoal text-brand-beige flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <>
      
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}

export default MyApp;
