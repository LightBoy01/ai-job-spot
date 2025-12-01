import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import useAuth from '@/hooks/useAuth'; // Import the useAuth hook

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { user } = useAuth(); // Use the auth state

  // The redirect is handled in handleLogin after the session cookie is set
  // useEffect(() => {
  //   if (user) {
  //     router.push('/admin');
  //   }
  // }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Attempting to log in...');

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const idToken = await userCredential.user.getIdToken();

      // Call API to set HttpOnly cookie
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set session cookie');
      }

      toast.success('Login successful! Redirecting...', { id: toastId });
      // The redirect is now handled manually to ensure the cookie is set first
      router.push('/admin');
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error('Login error:', error);
      const errorMessage =
        error.code === 'auth/invalid-credential'
          ? 'Invalid email or password. Please try again.'
          : 'An unexpected error occurred. Please try again later.';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center font-sans">
      <Head>
        <title>Admin Login - AI Job Spot</title>
      </Head>

      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/" passHref>
            <span className="text-4xl font-serif font-bold text-secondary-dark hover:text-secondary transition-colors cursor-pointer">
              AI Job Spot
            </span>
          </Link>
          <p className="text-lg text-neutral-600 mt-2">Admin Panel Login</p>
        </div>

        <main className="p-8 lg:p-10 bg-neutral-50 rounded-xl shadow-2xl border border-neutral-200">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-neutral-700 text-sm font-semibold mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="w-full p-3 rounded-md bg-neutral-100 border border-neutral-300 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-secondary-dark transition-shadow"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-neutral-700 text-sm font-semibold mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full p-3 rounded-md bg-neutral-100 border border-neutral-300 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-secondary-dark transition-shadow"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:bg-neutral-400"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
        </main>
      </div>

      <footer className="text-center mt-8">
        <p className="text-neutral-500 text-sm">
          &copy; {new Date().getFullYear()} AI Job Spot. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};

export default AdminLogin;
