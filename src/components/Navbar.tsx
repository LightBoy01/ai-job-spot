'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import useAuth from '@/hooks/useAuth';

/**
 * A responsive, stateful navigation bar with active link styling and a mobile menu.
 */
const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const navLinks = [
    { href: '/', label: 'Jobs' },
    { href: '/tools', label: 'Tools' },
    { href: '/articles', label: 'Articles' },
  ];

  const getLinkClassName = (path: string) => {
    return pathname === path
      ? 'text-primary-dark font-bold border-b-2 border-secondary pb-1'
      : 'text-neutral-700 hover:text-primary-dark transition-colors duration-300 pb-1';
  };

  return (
    <nav className="bg-transparent w-full sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Site Title */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-2 text-3xl font-serif font-bold text-primary-dark hover:text-primary transition-colors"
            >
              <Logo />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={getLinkClassName(link.href)}
                >
                  {link.label}
                </Link>
              ))}

              {/* Auth State Links */}
              {!loading && (
                <>
                  {user ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="text-neutral-700 hover:text-primary-dark transition-colors duration-300 pb-1 font-medium"
                      >
                        Dashboard
                      </Link>
                      <button onClick={logout} className="text-neutral-500 hover:text-red-600 transition-colors duration-300 pb-1 text-sm">
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="text-neutral-700 hover:text-primary-dark transition-colors duration-300 pb-1 font-medium"
                    >
                      Sign In
                    </Link>
                  )}
                </>
              )}

              <Link
                href="/post-a-job"
                className="bg-secondary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-secondary-dark transition-colors shadow-sm"
              >
                Post a Job
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="bg-neutral-100 inline-flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-primary-dark hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-100 focus:ring-primary-dark"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-neutral-50 border-t border-neutral-200">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${getLinkClassName(link.href)} block px-3 py-2`}
              >
                {link.label}
              </Link>
            ))}
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/dashboard" className="block px-3 py-2 text-neutral-700 hover:text-primary-dark font-medium">Dashboard</Link>
                    <button onClick={logout} className="block w-full text-left px-3 py-2 text-neutral-500 hover:text-red-600">Logout</button>
                  </>
                ) : (
                  <Link href="/login" className="block px-3 py-2 text-neutral-700 hover:text-primary-dark font-medium">Sign In</Link>
                )}
              </>
            )}
            <div className="pt-4 pb-2">
              <Link
                href="/post-a-job"
                className="bg-secondary text-white block px-3 py-2 rounded-md text-base font-medium text-center"
              >
                Post a Job
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;