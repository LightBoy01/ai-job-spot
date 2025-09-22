import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useAuth from '@/hooks/useAuth';

const AdminLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title = 'Admin - AI Job Spot' }) => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      // toast.success('Logged out successfully!'); // Reverted
      router.push('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
      // toast.error('Failed to log out.'); // Reverted
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-neutral-ivory flex items-center justify-center">
        <p className="text-lg font-serif text-neutral-700">Loading Admin...</p>
      </div>
    );
  }

  const navLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/jobs', label: 'Manage Jobs' },
    { href: '/admin/articles', label: 'Manage Articles' },
    { href: '/admin/reviews', label: 'Pending Reviews' },
  ];

  return (
    <div className="min-h-screen bg-neutral-ivory font-sans text-neutral-800">
      <Head>
        <title>{title}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-primary-dark text-neutral-100 p-6 flex flex-col justify-between">
          <div>
            <div className="mb-10">
              <Link href="/" passHref>
                <span className="text-2xl font-serif font-bold text-secondary-light hover:text-secondary transition-colors cursor-pointer">AI Job Spot</span>
              </Link>
              <p className="text-sm text-neutral-400 mt-1">Admin Panel</p>
            </div>
            <nav>
              <ul>
                {navLinks.map(link => (
                  <li key={link.href} className="mb-4">
                    <Link href={link.href} passHref>
                      <span className={`block py-2 px-4 rounded-md text-lg transition-colors ${router.pathname === link.href ? 'bg-secondary text-primary-dark font-semibold' : 'hover:bg-primary-light'}`}>
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg text-center font-semibold hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 lg:p-12">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
