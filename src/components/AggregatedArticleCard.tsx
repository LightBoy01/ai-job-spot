import React from 'react';
import { SerializedAggregatedArticle } from '@/lib/types';
import { format } from 'date-fns';

interface AggregatedArticleCardProps {
  article: SerializedAggregatedArticle;
}

const AggregatedArticleCard: React.FC<AggregatedArticleCardProps> = ({ article }) => {
  return (
    <div className="border border-neutral-200 rounded-lg p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
      <div>
        <h3 className="text-xl font-bold mb-2">
          <a href={article.link} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            {article.title}
          </a>
        </h3>
        <p className="text-neutral-600 mb-4">{article.excerpt}</p>
      </div>
      <div className="text-sm text-neutral-500">
        <span>Source: {article.source}</span>
        <span className="mx-2">|</span>
        <span>{article.publishDate ? format(new Date(article.publishDate), 'PPP') : ''}</span>
      </div>
    </div>
  );
};

export default AggregatedArticleCard;
