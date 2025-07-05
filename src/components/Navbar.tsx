import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

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
  const router = useRouter();

  // DRY Principle: Store nav links in an array to avoid repetition
  const navLinks = [
    { href: '/', label: 'Jobs' },
    { href: '/articles', label: 'Articles' },
  ];

  // A reusable function to determine link classes, cleaning up the JSX
  const getLinkClassName = (path) => {
    return router.pathname === path
      ? 'bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium' // Active link style
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium'; // Inactive link style
  };

  return (
    <nav className="bg-white shadow-md w-full sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Site Title */}
          <div className="flex-shrink-0">
            <Link href="/" legacyBehavior>
              <a className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
                AI Job Spot
              </a>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} legacyBehavior>
                  <a className={getLinkClassName(link.href)}>
                    {link.label}
                  </a>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Mobile Menu Button (Hamburger) */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="bg-gray-100 inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
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
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
             {navLinks.map((link) => (
                <Link key={link.href} href={link.href} legacyBehavior>
                  <a className={`${getLinkClassName(link.href)} block`}> {/* block makes it take full width */}
                    {link.label}
                  </a>
                </Link>
              ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
