import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import ArticleCard from '@/components/ArticleCard';
import AdContainer from '@/components/AdContainer';
import { getArticles } from '@/lib/firestoreClient';
import { SerializedArticleSummary } from '@/lib/types';
import { ARTICLE_FETCH_LIMIT } from '@/lib/constants';
import { GetStaticProps } from 'next';
import { useSessionScrollRestoration, getInitialStateFromSession, ScrollRestorationConfig } from '@/hooks/useSessionScrollRestoration';

interface ArticlesProps {
  initialArticles: SerializedArticleSummary[];
  lastDocId: string | null;
}

const articleScrollConfig: ScrollRestorationConfig = {
  listKey: 'articleListingArticles',
  lastDocIdKey: 'articleListingLastDocId',
  hasMoreKey: 'articleListingHasMore',
  scrollPosKey: 'articleListingScrollPos',
};

export default function Articles({ 
  initialArticles,
  lastDocId: initialLastDocId 
}: ArticlesProps) {
  const router = useRouter();
  
  const {
    initialItems: sessionArticles,
    initialLastDocId: sessionLastDocId,
    initialHasMore: sessionHasMore,
  } = getInitialStateFromSession<SerializedArticleSummary>(articleScrollConfig);

  // State management
  const [displayedArticles, setDisplayedArticles] = useState(sessionArticles || initialArticles);
  const [lastDocId, setLastDocId] = useState(sessionLastDocId || initialLastDocId);
  const [hasMore, setHasMore] = useState(sessionHasMore !== null ? sessionHasMore : initialArticles.length === ARTICLE_FETCH_LIMIT);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isFetching = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFilterChange = (newFilter: 'all' | 'editorial' | 'briefing') => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, filter: newFilter },
    }, undefined, { shallow: true });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Hook for saving and restoring state
  useSessionScrollRestoration({
    items: displayedArticles,
    lastDocId,
    hasMore,
    config: articleScrollConfig,
  });

  // Derived state for filtering
  const filter = (router.query.filter === 'editorial' || router.query.filter === 'briefing')
    ? router.query.filter
    : 'all';

  // Data fetching logic
  const fetchArticles = useCallback(async (query: string, startAfterId: string | null, currentFilter: 'all' | 'editorial' | 'briefing') => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    const isNewSearch = startAfterId === null;

    const searchParams = new URLSearchParams({ q: query, startAfter: startAfterId || '', limit: String(ARTICLE_FETCH_LIMIT) });
    if (currentFilter && currentFilter !== 'all') {
      searchParams.append('filter', currentFilter);
    }

    try {
      const response = await fetch(`/api/articles/search?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch articles');
      const { articles: newFetchedArticles, lastVisible: newLastVisible } = await response.json();

      setHasMore(newFetchedArticles.length === ARTICLE_FETCH_LIMIT);
      setDisplayedArticles(prev => isNewSearch ? newFetchedArticles : [...prev, ...newFetchedArticles.filter((a: SerializedArticleSummary) => !prev.find((p: SerializedArticleSummary) => p.id === a.id))]);
      setLastDocId(newLastVisible);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  // Effect to trigger fetch on search/filter change
  useEffect(() => {
    const handler = setTimeout(() => fetchArticles(searchQuery, null, filter), 500);
    return () => clearTimeout(handler);
  }, [searchQuery, filter, fetchArticles]);

  const loader = useRef(null);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading) {
      fetchArticles(searchQuery, lastDocId, filter);
    }
  }, [hasMore, loading, searchQuery, lastDocId, filter, fetchArticles]);

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: "20px",
      threshold: 0
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loader.current) observer.observe(loader.current);
  }, [handleObserver]);



  // Button styles
  const getButtonClass = (buttonFilter: 'all' | 'editorial' | 'briefing') => {
    const baseClass = "px-6 py-3 rounded-lg font-semibold transition-colors font-sans tracking-wide";
    if (filter === buttonFilter) {
      return `${baseClass} bg-primary text-white shadow-md`;
    } else {
      return `${baseClass} bg-neutral-cream/60 text-primary-dark/80 hover:bg-primary/10 hover:text-primary-dark`;
    }
  };

  return (
    <Layout>
      <Head>
        <title>AI Career Insights &amp; Articles | AI Job Spot</title>
        <meta name="description" content="Explore insightful articles and expert guides on the AI job market, career development, and the future of artificial intelligence. Stay informed with AI Job Spot." />
      </Head>
      <div className="container mx-auto px-4 py-12 font-serif">
        <h1 className="page-title mb-6">Insights & Musings</h1>
        <p className="text-xl text-neutral-600 mb-12 text-center max-w-2xl mx-auto font-sans">
          Delve into our curated collection of articles and guides on the evolving landscape of AI careers and technology.
        </p>
        
        <div className="mb-12 flex flex-col items-center"> 
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <button onClick={() => handleFilterChange('all')} className={getButtonClass('all')}>All Content</button>
            <button onClick={() => handleFilterChange('editorial')} className={getButtonClass('editorial')}>Editorials</button>
            <button onClick={() => handleFilterChange('briefing')} className={getButtonClass('briefing')}>Curated Briefings</button>
            <div className="cursor-pointer" title="Editorials are original content from AI Job Spot. Briefings are curated summaries of external articles with links to the source.">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search by title, author, or tags..."
            className="w-full max-w-lg p-4 font-sans border-2 border-primary-dark/20 bg-neutral-cream/30 rounded-lg shadow-inner focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {displayedArticles.length === 0 && !loading ? (
          <p className="text-center text-neutral-600 text-lg font-serif">No articles found. Please check back later or refine your search.</p>
        ) : (
          <div className="space-y-10">
            {(() => {
              const articleRows = [];
              const chunkSize = 3; // Corresponds to the 3-column grid on large screens
              for (let i = 0; i < displayedArticles.length; i += chunkSize) {
                articleRows.push(displayedArticles.slice(i, i + chunkSize));
              }
              return articleRows.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {row.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                  {isMounted && rowIndex < articleRows.length - 1 && (
                    <div className="my-8">
                      <AdContainer
                        slot={
                          process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_LISTING_SLOT || ''
                        }
                      />
                    </div>
                  )}
                </React.Fragment>
              ));
            })()}
          </div>
        )}

        <div className="text-center mt-12 h-10">
          {loading && <p className="text-neutral-500 font-sans">Loading more articles...</p>}
          {!hasMore && displayedArticles.length > 0 && (
            <p className="text-neutral-600 font-serif text-lg pt-8 border-t border-neutral-200">You&apos;ve reached the end of the article listings.</p>
          )}
          <div ref={loader} />
        </div>
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<ArticlesProps> = async () => {
  try {
    const { articles, lastVisible } = await getArticles(ARTICLE_FETCH_LIMIT);
    return {
      props: {
        initialArticles: articles.map((article) => ({
          id: article.id!,
          title: article.title,
          author: article.author,
          publishDate: article.publishDate ? article.publishDate.toISOString() : null,
          slug: article.slug,
          contentType: article.contentType ?? 'editorial',
          issueNo: article.issueNo ?? 1,
          volumeNo: article.volumeNo ?? 1,
          imageUrl: article.imageUrl ?? null,
          tags: article.tags ?? [],
          excerpt: article.excerpt ?? '',
          sourceName: article.sourceName ?? null,
          originalUrl: article.originalUrl ?? null,
        })),
        lastDocId: lastVisible ? lastVisible.id : null,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Error fetching initial articles:', error);
    return {
      props: {
        initialArticles: [],
        lastDocId: null,
      },
      revalidate: 60,
    };
  }
};