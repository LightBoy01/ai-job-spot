import Navbar from './Navbar';
import Head from 'next/head';

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
    <div className="min-h-screen bg-neutral-50 font-sans">
      
      {/* The Navbar is rendered at the top of every page */}
      <Navbar />

      {/* Main content area - now full width by default */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-12">
          
          {/* Primary Content Column (now full width) */}
          <div className="lg:col-span-12">
            {children}
          </div>

          {/* AdContainer will now be placed strategically within pages */}

        </div>
      </main>
    </div>
  );
};

export default Layout;
