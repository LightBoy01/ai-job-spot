
import React from 'react';
import Link from 'next/link';

export interface Breadcrumb {
  label: string;
  href: string;
  isCurrent: boolean;
}

interface BreadcrumbsProps {
  crumbs: Breadcrumb[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ crumbs }) => {
  if (!crumbs || crumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm font-serif">
      <ol className="flex items-center flex-wrap space-x-2 text-neutral-500">
        {crumbs.map((crumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg className="w-4 h-4 mx-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            )}
            {crumb.isCurrent ? (
              <span className="font-semibold text-neutral-700">{crumb.label}</span>
            ) : (
              <Link href={crumb.href}>
                <a className="hover:text-primary-dark transition-colors">{crumb.label}</a>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
