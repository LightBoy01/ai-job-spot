import Link from 'next/link';
import { formatDate } from '@/lib/dateUtils';

import { SerializedArticleSummary } from '@/pages/articles';

interface ArticleCardProps {
  article: SerializedArticleSummary;
}

import React from 'react';
const ArticleCard = React.memo(({ article }: ArticleCardProps) => {
  const { title, author, publishDate, slug, issueNo, volumeNo } = article;

  return (
    <Link href={`/articles/${slug}`} passHref className="block bg-neutral-50 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer border border-neutral-200 hover:border-primary-dark">
      <div className="flex flex-col">
        <h3 className="text-2xl font-serif font-semibold text-neutral-800 group-hover:text-primary-dark transition-colors leading-tight mb-3">
          {title}
        </h3>
        <p className="mt-2 text-base font-sans text-neutral-600">
          By {author} on {formatDate(publishDate)}
          {(issueNo !== undefined && volumeNo !== undefined) && (
            <span className="block text-sm text-neutral-500 mt-1">Vol. {volumeNo}, Issue No. {issueNo}</span>
          )}
        </p>
      </div>
    </Link>
  );
});

ArticleCard.displayName = 'ArticleCard';

export default ArticleCard;
