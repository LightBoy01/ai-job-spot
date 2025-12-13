import React from 'react';
import Link from 'next/link';

interface BrowseByProps {
  topTags: string[];
  topLocations: string[];
}

const BrowseBy: React.FC<BrowseByProps> = ({ topTags, topLocations }) => {
  return (
    <section className="my-16 bg-white p-8 rounded-xl border border-neutral-200 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Popular Skills */}
        <div>
          <h2 className="text-2xl font-serif font-bold text-primary-dark mb-6 flex items-center">
            <span className="w-1.5 h-8 bg-secondary mr-3 rounded-full"></span>
            Popular Skills
          </h2>
          <div className="flex flex-wrap gap-3">
            {topTags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`} // Removed toLowerCase() to match pSEO logic
                className="bg-neutral-50 hover:bg-primary hover:text-white text-neutral-700 px-4 py-2 rounded-lg border border-neutral-200 transition-all duration-200 text-sm font-medium"
              >
                {tag}
              </Link>
            ))}
            <Link
              href="/tags"
              className="px-4 py-2 text-secondary font-semibold hover:text-secondary-dark transition-colors text-sm flex items-center"
            >
              View All Skills &rarr;
            </Link>
          </div>
        </div>

        {/* Top Locations */}
        <div>
          <h2 className="text-2xl font-serif font-bold text-primary-dark mb-6 flex items-center">
             <span className="w-1.5 h-8 bg-brand-gold mr-3 rounded-full"></span>
            Top Locations
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topLocations.map((location) => (
              <li key={location}>
                <Link
                  href={`/jobs/location/${encodeURIComponent(location)}`}
                  className="flex items-center text-neutral-600 hover:text-primary-dark group transition-colors p-2 rounded-md hover:bg-neutral-50"
                >
                  <svg className="w-4 h-4 mr-2 text-neutral-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate max-w-[180px] text-sm">{location}</span>
                </Link>
              </li>
            ))}
             <li className="mt-2">
                <span className="text-neutral-400 text-sm italic pl-2">
                  + more global hubs
                </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default BrowseBy;
