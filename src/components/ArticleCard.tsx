import React from 'react'; // Added import
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/dateUtils';
import { SerializedArticleSummary } from '@/lib/types';

interface ArticleCardProps {
  article: SerializedArticleSummary;
}

const ArticleCard = React.memo(({ article }: ArticleCardProps) => {

  const { title, author, publishDate, slug, issueNo, volumeNo, imageUrl } = article;

  return (
    <Link href={`/articles/${slug}`} passHref className="block group">
      <div className="bg-neutral-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 ease-in-out border border-neutral-200 hover:border-primary-dark overflow-hidden h-full flex flex-col">
        {imageUrl && (
          <div className="relative w-full aspect-video">
            <Image
              src={imageUrl}
              alt={`Featured image for ${title}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="p-8 flex flex-col flex-grow">
          <h3 className="text-2xl font-serif font-semibold text-neutral-800 group-hover:text-primary-dark transition-colors leading-tight mb-3">
            {title}
          </h3>
          <div className="flex-grow" />
          <p className="mt-4 text-base font-sans text-neutral-600">
            By {author} on {formatDate(publishDate)}
            {(issueNo !== undefined && volumeNo !== undefined) && (
              <span className="block text-sm text-neutral-500 mt-1">Vol. {volumeNo}, Issue No. {issueNo}</span>
            )}
          </p>
        </div>
      </div>
    </Link>
  );
});

ArticleCard.displayName = 'ArticleCard';

export default ArticleCard;
