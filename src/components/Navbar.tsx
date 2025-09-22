'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo'; // Import the Logo component

/**
 * A responsive, stateful navigation bar with active link styling and a mobile menu.
 *
 * Features:
 * - Site title linking to the homepage.
 * - Primary navigation links.
 * - Active styling for the current page link.
 * - A functional "hamburger" menu for mobile devices.
 * 
 * @returns {JSX.Element} The rendered Navbar component.
 */
const Navbar = () => {
  // State to manage the visibility of the mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hook to get the current route for active link styling
  const pathname = usePathname();

  // DRY Principle: Store nav links in an array to avoid repetition
  const navLinks = [
    { href: '/', label: 'Jobs' },
    { href: '/articles', label: 'Articles' },
  ];

  // A reusable function to determine link classes, cleaning up the JSX
  const getLinkClassName = (path: string) => {
    return pathname === path
      ? 'text-primary-dark font-bold border-b-2 border-secondary pb-1' // Active link style
      : 'text-neutral-700 hover:text-primary-dark transition-colors duration-300 pb-1'; // Inactive link style
  };

  return (
    <nav className="bg-transparent w-full sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 border-b border-black/5">
          
          {/* Site Title */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-3xl font-serif font-bold text-primary-dark hover:text-primary transition-colors">
                <Logo /> {/* Integrate the Logo component */}
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={getLinkClassName(link.href)}>
                  {link.label}
                </Link>
              ))}
              <Link href="/post-a-job" className="bg-secondary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-secondary-dark transition-colors shadow-sm">
                Post a Job
              </Link>
            </div>
          </div>
          
          {/* Mobile Menu Button (Hamburger) */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="bg-neutral-100 inline-flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-primary-dark hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-100 focus:ring-primary-dark"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
              /* Icon when menu is open */
                (<svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>)
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-neutral-50 border-t border-neutral-200">
            <Link href="/post-a-job" className="bg-secondary text-white block px-3 py-2 rounded-md text-base font-medium text-center mb-2">
              Post a Job
            </Link>
             {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={`${getLinkClassName(link.href)} block`}> {/* block makes it take full width */}
                    {link.label}
                </Link>
              ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
