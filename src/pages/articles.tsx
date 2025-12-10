import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import ArticleCard from '@/components/ArticleCard';
import AdContainer from '@/components/AdContainer';
import { getArticlesServer } from '@/lib/firestoreServer';
import { SerializedArticleSummary } from '@/lib/types';
import { ARTICLE_FETCH_LIMIT, HUBS } from '@/lib/constants';
import { GetStaticProps } from 'next';
import { useSessionScrollRestoration, getInitialStateFromSession, ScrollRestorationConfig } from '@/hooks/useSessionScrollRestoration';
import Pagination from '@/components/Pagination';
import { smoothScrollToTop } from '@/lib/utils';

interface ArticlesProps {
  initialArticles: SerializedArticleSummary[];
  lastDocId: string | null;
}

const articleScrollConfig: ScrollRestorationConfig = {
  listKey: 'articleListingArticles',
  lastDocIdKey: 'articleListingLastDocId',
  hasMoreKey: 'articleListingHasMore',
  scrollPosKey: 'articleListingScrollPos',
  pageKey: 'articleListingPage',
  pageCursorsKey: 'articleListingPageCursors',
  filtersKey: 'articleListingFilters',
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
    initialPage,
    initialPageCursors,
    initialFilters,
  } = getInitialStateFromSession<SerializedArticleSummary>(articleScrollConfig);

  // State management
  const [displayedArticles, setDisplayedArticles] = useState(sessionArticles || initialArticles);
  const [lastDocId, setLastDocId] = useState(sessionLastDocId || initialLastDocId);
  const [hasMore, setHasMore] = useState(sessionHasMore !== null ? sessionHasMore : initialArticles.length === ARTICLE_FETCH_LIMIT);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialFilters?.query || '');
  const isFetching = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  // Pagination State
  const [page, setPage] = useState<number>(initialPage);
  const [pageCursors, setPageCursors] = useState<(string | null)[]>(initialPageCursors);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFilterChange = (newFilter: 'all' | 'editorial' | 'briefing') => {
    if (newFilter === (router.query.filter || 'all')) return;
    
    setPage(1);
    setPageCursors([null]);
    
    // reset hub when changing type filter? No, they can coexist.
    // Actually, let's keep them orthogonal.
    
    const query = { ...router.query };
    if (newFilter === 'all') {
        delete query.filter;
    } else {
        query.filter = newFilter;
    }

    router.push({
      pathname: router.pathname,
      query,
    }, undefined, { shallow: true });
  };

  const handleHubChange = (newHub: string | null) => {
    const currentHub = router.query.hub;
    if (newHub === currentHub) return;

    setPage(1);
    setPageCursors([null]);

    const query = { ...router.query };
    if (newHub) {
        query.hub = newHub;
    } else {
        delete query.hub;
    }

    router.push({
        pathname: router.pathname,
        query,
    }, undefined, { shallow: true });
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Derived state for filters
  const filter = (router.query.filter === 'editorial' || router.query.filter === 'briefing')
    ? router.query.filter
    : 'all';
  
  const currentHub = typeof router.query.hub === 'string' ? router.query.hub : null;

  // Data fetching logic
  const fetchArticles = useCallback(async (query: string, cursor: string | null, currentFilter: 'all' | 'editorial' | 'briefing', hub: string | null) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    
    const searchParams = new URLSearchParams({ q: query, startAfter: cursor || '', limit: String(ARTICLE_FETCH_LIMIT) });
    if (currentFilter && currentFilter !== 'all') {
      searchParams.append('filter', currentFilter);
    }
    if (hub) {
        searchParams.append('hub', hub);
    }

    try {
      const response = await fetch(`/api/articles/search?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch articles');
      const { articles: newFetchedArticles, lastVisible: newLastVisible } = await response.json();

      setHasMore(newFetchedArticles.length === ARTICLE_FETCH_LIMIT);
      setDisplayedArticles(newFetchedArticles);
      setLastDocId(newLastVisible);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setHasMore(false);
      setDisplayedArticles([]);
    } finally {
      setLoading(false);
      isFetching.current = false;
      smoothScrollToTop(1200); // Gentle 1.2s scroll
    }
  }, []);

  const handleNextPage = useCallback(() => {
    if (!lastDocId) return;
    setPageCursors((prev) => [...prev, lastDocId]);
    setPage((prev) => prev + 1);
    fetchArticles(searchQuery, lastDocId, filter, currentHub);
  }, [lastDocId, fetchArticles, searchQuery, filter, currentHub]);

  const handlePrevPage = useCallback(() => {
    if (page <= 1) return;
    const newPage = page - 1;
    const prevCursor = pageCursors[newPage - 1];
    setPageCursors((prev) => prev.slice(0, -1));
    setPage(newPage);
    fetchArticles(searchQuery, prevCursor, filter, currentHub);
  }, [page, pageCursors, fetchArticles, searchQuery, filter, currentHub]);

  // Effect to trigger fetch on search/filter/hub change
  const prevFilterRef = useRef(filter);
  const prevQueryRef = useRef(searchQuery);
  const prevHubRef = useRef(currentHub);

  useEffect(() => {
      const handler = setTimeout(() => {
          const filterChanged = prevFilterRef.current !== filter;
          const queryChanged = prevQueryRef.current !== searchQuery;
          const hubChanged = prevHubRef.current !== currentHub;

          if (filterChanged || queryChanged || hubChanged) {
              setPage(1);
              setPageCursors([null]);
              fetchArticles(searchQuery, null, filter, currentHub);
              
              prevFilterRef.current = filter;
              prevQueryRef.current = searchQuery;
              prevHubRef.current = currentHub;
          }
      }, 500);
      
      return () => clearTimeout(handler);
  }, [filter, searchQuery, currentHub, fetchArticles]);

  // Button styles
  const getButtonClass = (isActive: boolean) => {
    const baseClass = "px-6 py-3 rounded-lg font-semibold transition-colors font-sans tracking-wide";
    if (isActive) {
      return `${baseClass} bg-primary text-white shadow-md`;
    } else {
      return `${baseClass} bg-neutral-cream/60 text-primary-dark/80 hover:bg-primary/10 hover:text-primary-dark`;
    }
  };

  const getHubChipClass = (isActive: boolean) => {
      const baseClass = "px-4 py-2 rounded-full text-sm font-medium transition-colors border";
      if (isActive) {
          return `${baseClass} bg-secondary text-primary-dark border-secondary shadow-sm`;
      } else {
          return `${baseClass} bg-white text-neutral-600 border-neutral-200 hover:border-secondary hover:text-secondary-dark`;
      }
  }

  // Hook for saving and restoring state
  useSessionScrollRestoration({
    items: displayedArticles,
    lastDocId,
    hasMore,
    page,
    pageCursors,
    activeFilters: { query: searchQuery, filter, hub: currentHub },
    config: articleScrollConfig,
  });

  return (
    <Layout>
      <Head>
        <title>AI Career Insights &amp; Articles | AI Job Spot</title>
        <meta name="description" content="Explore insightful articles and expert guides on the AI job market, career development, and the future of artificial intelligence. Stay informed with AI Job Spot." />
      </Head>
      <div className="container mx-auto px-4 py-12 font-serif">
        <h1 className="page-title mb-6">Insights & Musings</h1>
        <p className="text-xl text-neutral-600 mb-8 text-center max-w-2xl mx-auto font-sans">
          Delve into our curated collection of articles and guides on the evolving landscape of AI careers and technology.
        </p>
        
        <div className="mb-12 flex flex-col items-center space-y-6"> 
          {/* Main Filters */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => handleFilterChange('all')} className={getButtonClass(filter === 'all')}>All Content</button>
            <button onClick={() => handleFilterChange('editorial')} className={getButtonClass(filter === 'editorial')}>Editorials</button>
            <button onClick={() => handleFilterChange('briefing')} className={getButtonClass(filter === 'briefing')}>Curated Briefings</button>
          </div>

          {/* Hub Filters */}
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl">
             <button 
                onClick={() => handleHubChange(null)}
                className={getHubChipClass(currentHub === null)}
             >
                 All Topics
             </button>
             {HUBS.map(hub => (
                 <button
                    key={hub}
                    onClick={() => handleHubChange(hub)}
                    className={getHubChipClass(currentHub === hub)}
                 >
                     {hub}
                 </button>
             ))}
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

        <Pagination 
            currentPage={page}
            hasPrevious={page > 1}
            hasNext={hasMore}
            onPrevious={handlePrevPage}
            onNext={handleNextPage}
            isLoading={loading}
        />
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<ArticlesProps> = async () => {
  try {
    const { articles, lastVisible } = await getArticlesServer(ARTICLE_FETCH_LIMIT);
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