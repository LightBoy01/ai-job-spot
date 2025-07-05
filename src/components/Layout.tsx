import Navbar from './Navbar';
import AdContainer from './AdContainer';
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string; // Optional, as it's primarily handled by root layout metadata
  description?: string; // Optional, as it's primarily handled by root layout metadata
}

/**
 * The main layout component for the entire site.
 * It includes the Navbar and a responsive two-column structure.
 * Page-specific SEO metadata (title, description) is now primarily handled
 * by the root `src/app/layout.tsx` or individual page `metadata` exports.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The main content to be rendered.
 * @param {string} [props.title] - The title for the page (for internal use or fallback).
 * @param {string} [props.description] - The meta description (for internal use or fallback).
 * @returns {JSX.Element} The rendered Layout component.
 */
const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* The Navbar is rendered at the top of every page */}
      <Navbar />

      {/* Main content area */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
          
          {/* Primary Content Column (approx. 70%) */}
          <div className="lg:col-span-8">
            {children}
          </div>

          {/* Sidebar Column (approx. 30%) */}
          <aside className="lg:col-span-4 mt-8 lg:mt-0">
            {/* The sticky container ensures the ad stays visible on scroll */}
            <div className="sticky top-24"> 
              <AdContainer slot={process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT || ''} />
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
};

export default Layout;
