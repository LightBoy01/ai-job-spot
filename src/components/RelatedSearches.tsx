import React from 'react';
import Link from 'next/link';

interface RelatedSearchesProps {
  entities: { type: 'skill' | 'location'; value: string }[];
}

const RelatedSearches: React.FC<RelatedSearchesProps> = ({ entities }) => {
  if (!entities || entities.length === 0) {
    return null;
  }

  return (
    <div className="bg-neutral-50/70 p-6 rounded-lg shadow-inner border border-neutral-200/80 my-8">
      <h3 className="text-xl font-bold text-neutral-800 mb-4 font-serif">Related Searches</h3>
      <div className="flex flex-wrap gap-2">
        {entities.map(entity => (
          <Link href={`/jobs/${entity.type}/${encodeURIComponent(entity.value)}`} key={`${entity.type}-${entity.value}`}>
            <a className="inline-block bg-primary/10 text-primary-dark font-semibold px-3 py-1 rounded-full text-sm hover:bg-primary/20 transition-colors">
              {entity.value}
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedSearches;