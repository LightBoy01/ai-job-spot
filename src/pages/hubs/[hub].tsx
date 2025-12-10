import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Layout from '@/components/Layout';
import ArticleCard from '@/components/ArticleCard';
import { getArticlesByHub } from '@/lib/firestoreClient';
import { SerializedArticleSummary } from '@/lib/types';
import AdContainer from '@/components/AdContainer';
import React, { useState, useCallback } from 'react';
import { useSessionScrollRestoration, getInitialStateFromSession, ScrollRestorationConfig } from '@/hooks/useSessionScrollRestoration';
import { smoothScrollToTop } from '@/lib/utils';
import Pagination from '@/components/Pagination';
import { HUBS } from '@/lib/constants';

interface HubPageProps {
  hub: string;
  initialArticles: SerializedArticleSummary[];
  lastArticleDocId: string | null;
}

const hubScrollConfig = (hub: string): ScrollRestorationConfig => ({
    listKey: `hubArticles-${hub}`,
    lastDocIdKey: `hubArticlesLastDoc-${hub}`,
    hasMoreKey: `hubArticlesHasMore-${hub}`,
    scrollPosKey: `hubArticlesScrollPos-${hub}`,
    pageKey: `hubArticlesPage-${hub}`,
    pageCursorsKey: `hubArticlesPageCursors-${hub}`,
    filtersKey: `hubArticlesFilters-${hub}`,
});

const HubPage: NextPage<HubPageProps> = ({
  hub,
  initialArticles,
  lastArticleDocId: staticLastArticleDocId,
}) => {
    const config = hubScrollConfig(hub);

    const { 
        initialItems: sessionArticles, 
        initialLastDocId: sessionLastArticleDocId, 
        initialHasMore: sessionHasMoreArticles,
        initialPage: initialArticlePage,
        initialPageCursors: initialArticlePageCursors,
    } = getInitialStateFromSession<SerializedArticleSummary>(config);


  const [displayedArticles, setDisplayedArticles] = useState(sessionArticles || initialArticles);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [hasMoreArticles, setHasMoreArticles] = useState(sessionHasMoreArticles !== null ? sessionHasMoreArticles : true);
  const [lastArticleDocIdState, setLastArticleDocIdState] = useState(sessionLastArticleDocId || staticLastArticleDocId);

  // Pagination State for Articles
  const [articlePage, setArticlePage] = useState<number>(initialArticlePage);
  const [articleCursors, setArticleCursors] = useState<(string | null)[]>(initialArticlePageCursors);


  const fetchArticles = useCallback(async (cursor: string | null) => {
    if (loadingArticles) return;
    setLoadingArticles(true);

    try {
      // Re-use the main search API which now supports 'hub' param
      const searchParams = new URLSearchParams({ hub: hub, startAfter: cursor || '', limit: '10' });
      const response = await fetch(`/api/articles/search?${searchParams.toString()}`);
      const data = await response.json();

      if (data.articles.length === 0) {
        setHasMoreArticles(false);
        setDisplayedArticles([]);
      } else {
        setDisplayedArticles(data.articles);
        setLastArticleDocIdState(data.lastVisible);
      }
    } catch (error) {
      console.error('Error fetching more articles:', error);
      setHasMoreArticles(false);
    } finally {
      setLoadingArticles(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [loadingArticles, hub]);


  const handleNextArticlePage = useCallback(() => {
      if (!lastArticleDocIdState) return;
      setArticleCursors(prev => [...prev, lastArticleDocIdState]);
      setArticlePage(prev => prev + 1);
      fetchArticles(lastArticleDocIdState);
  }, [lastArticleDocIdState, fetchArticles]);

  const handlePrevArticlePage = useCallback(() => {
      if (articlePage <= 1) return;
      const newPage = articlePage - 1;
      const prevCursor = articleCursors[newPage - 1];
      setArticleCursors(prev => prev.slice(0, -1));
      setArticlePage(newPage);
      fetchArticles(prevCursor);
  }, [articlePage, articleCursors, fetchArticles]);


  // Apply session restoration
  useSessionScrollRestoration({
      items: displayedArticles,
      lastDocId: lastArticleDocIdState,
      hasMore: hasMoreArticles,
      page: articlePage,
      pageCursors: articleCursors,
      activeFilters: null,
      config: config
  });

  // Helper to format the hub title nicely
  const displayTitle = hub; // It is already formatted in the URL/param usually? 
  // Actually, the hub param comes from getStaticProps context.params which is the URL part.
  // But HUBS constant has nice names.
  // We need to match the slug to the nice name if possible, or just use the slug.
  // Since we don't have a slug-to-name map, and the URLs will likely be encoded strings of the names...
  // Wait, categorization script uses the full name as the key. So the 'hub' field in DB is full name (lowercase).
  // The URL should probably be slugified, but for now let's assume it's the full name URI encoded.
  
  return (
    <Layout>
      <Head>
        <title>{`${hub} | AI Job Spot`}</title>
        <meta
          name="description"
          content={`Explore articles and insights related to ${hub}.`}
        />
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="page-title text-4xl sm:text-5xl md:text-6xl mb-4 capitalize">
          {hub}
        </h1>
        <p className="mt-2 text-lg text-neutral-600 font-sans max-w-2xl mx-auto">
          Deep dive into our curated collection of content focusing on {hub}.
        </p>
        
        <hr className="my-16 border-t border-neutral-200/80" />

        <div className="mt-12 text-left">
          <h2 className="text-3xl font-serif font-bold text-primary-dark mb-6">
            Articles
          </h2>
          {displayedArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {displayedArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6 bg-neutral-50/70 rounded-lg border border-neutral-200/80">
              <h3 className="text-xl font-serif text-primary-dark">No Articles Found</h3>
              <p className="text-neutral-600 mt-2 max-w-md mx-auto">There are currently no articles in this hub. Please check back later.</p>
            </div>
          )}
          
           <Pagination
            currentPage={articlePage}
            hasPrevious={articlePage > 1}
            hasNext={hasMoreArticles}
            onPrevious={handlePrevArticlePage}
            onNext={handleNextArticlePage}
            isLoading={loadingArticles}
          />
        </div>
        <div className="my-12">
          <AdContainer
            slot={process.env.NEXT_PUBLIC_ADSENSE_TAG_PAGE_SLOT || ''}
          />
        </div>
      </div>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
    // Generate paths for all known hubs
    const paths = HUBS.map(hub => ({
        params: { hub: hub.toLowerCase() } // Ensure we match the lowercase storage
    }));

    return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<
  HubPageProps,
  { hub: string }
> = async (context) => {
  const hub = context.params?.hub;

  if (!hub) {
    return { notFound: true };
  }
  
  // Decode in case it was URL encoded
  const decodedHub = decodeURIComponent(hub);

  const { articles, lastVisible: lastArticleDoc } = await getArticlesByHub(decodedHub, 10);

  return {
    props: {
      hub: decodedHub,
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
      })),
      lastArticleDocId: lastArticleDoc ? lastArticleDoc.id : null,
    },
    revalidate: 60,
  };
};

export default HubPage;