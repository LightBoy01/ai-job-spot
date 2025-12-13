import React from 'react'; // Added import
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/dateUtils';
import { SerializedArticleSummary } from '@/lib/types';

interface ArticleCardProps {
  article: SerializedArticleSummary;
}

const ArticleCard = React.memo(({ article }: ArticleCardProps) => {
  const { title, author, publishDate, slug, issueNo, volumeNo, imageUrl, hub } =
    article;

  return (
    <Link href={`/articles/${slug}`} passHref className="block group">
      <div className="relative bg-white rounded-lg shadow-md hover:shadow-xl active:scale-[0.98] transition-all duration-300 ease-in-out border border-neutral-200/80 hover:border-secondary/50 overflow-hidden h-full flex flex-col">
        {article.contentType === 'briefing' && (
          <span className="absolute top-0 left-0 bg-accent-dark text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10">
            BRIEFING
          </span>
        )}
        {imageUrl && (
          <div className="relative w-full aspect-video overflow-hidden">
            <Image
              src={imageUrl}
              alt={`Featured image for ${title}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        )}
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-2xl font-serif font-bold text-primary-dark group-hover:text-secondary-dark transition-colors leading-tight mb-3">
            {title}
          </h3>
          {hub && (
            <div className="mb-3">
              <span className="inline-block border border-secondary/30 bg-secondary/10 text-secondary-dark text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                {hub}
              </span>
            </div>
          )}
          <div className="flex-grow" />
          <div className="mt-4 text-base font-sans text-neutral-600">
            <p>
              By {author} on {formatDate(publishDate)}
              {issueNo !== undefined && volumeNo !== undefined && (
                <span className="block text-sm text-neutral-500 mt-1">
                  Vol. {volumeNo}, Issue No. {issueNo}
                </span>
              )}
            </p>
            {article.contentType === 'briefing' && article.sourceName && article.originalUrl && (
                <p className="mt-2 text-sm text-neutral-500">
                    Source: <a 
                        href={article.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary-dark hover:underline truncate"
                    >
                        {article.sourceName} ↗
                    </a>
                </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});

ArticleCard.displayName = 'ArticleCard';

export default ArticleCard;
