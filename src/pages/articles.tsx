import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ArticleCard from '@/components/ArticleCard';
import AdContainer from '@/components/AdContainer';
import { getArticles } from '@/lib/firestoreClient'; // Keep for initial static fetch
import { Article } from '@/lib/types';
import { ARTICLE_FETCH_LIMIT } from '@/lib/constants';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface SerializedArticle extends Omit<Article, 'publishDate'> {
  publishDate: string;
}

// A more lightweight type for the article cards, excluding the full content.
export type SerializedArticleSummary = Omit<SerializedArticle, 'contentBody'>;

interface ArticlesProps {
  initialArticles: SerializedArticleSummary[];
  lastDocId: string | null;
}

export default function Articles({ initialArticles, lastDocId: initialLastDocId }: ArticlesProps) {
  const router = useRouter();

  const [displayedArticles, setDisplayedArticles] = useState<SerializedArticleSummary[]>(() => {
    if (typeof window !== 'undefined') {
      const savedArticles = sessionStorage.getItem('articleListingArticles');
      return savedArticles ? JSON.parse(savedArticles) : initialArticles;
    }
    return initialArticles;
  });
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedHasMore = sessionStorage.getItem('articleListingHasMore');
      return savedHasMore ? JSON.parse(savedHasMore) : true;
    }
    return true;
  });
  const [lastDocId, setLastDocId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const savedLastDocId = sessionStorage.getItem('articleListingLastDocId');
      return savedLastDocId || initialLastDocId;
    }
    return initialLastDocId;
  });
  const loader = useRef(null);

  const fetchMoreArticles = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      let startAfterSnapshot = undefined;
      if (lastDocId) {
        const docRef = doc(db, 'articles', lastDocId);
        startAfterSnapshot = await getDoc(docRef);
        if (!startAfterSnapshot.exists()) {
          console.warn(`Last document with ID ${lastDocId} does not exist. Stopping pagination.`);
          setHasMore(false);
          setLoading(false);
          return;
        }
      }

      const { articles: newFetchedArticles, lastVisible: newLastVisible } = await getArticles(ARTICLE_FETCH_LIMIT, startAfterSnapshot);

      if (newFetchedArticles.length === 0) {
        setHasMore(false);
      } else {
        setDisplayedArticles(prevArticles => {
          // Filter out any duplicates that might occur if an article was added/updated during revalidation
          const uniqueNewArticles = newFetchedArticles.map(article => ({
            ...article,
            publishDate: article.publishDate.toISOString(), // Convert Date to ISO string
          })).filter((newArticle: SerializedArticleSummary) =>
            !prevArticles.some(existingArticle => existingArticle.id === newArticle.id)
          );
          return [...prevArticles, ...uniqueNewArticles];
        });
        setLastDocId(newLastVisible ? newLastVisible.id : null);
      }
    } catch (error) {
      console.error('Error fetching more articles:', error);
      setHasMore(false); // Stop trying to load more on error
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, lastDocId]);

  useEffect(() => {
    const handleObserver = (entities: IntersectionObserverEntry[]) => {
      const target = entities[0];
      if (target.isIntersecting && hasMore && !loading) {
        fetchMoreArticles();
      }
    };

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 1.0,
    });

    const currentLoader = loader.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, loading, fetchMoreArticles]); // fetchMoreArticles is now a stable dependency

  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      // Only save state if navigating away from the current page
      if (router.asPath === url) return;

      sessionStorage.setItem('articleListingArticles', JSON.stringify(displayedArticles));
      sessionStorage.setItem('articleListingLastDocId', lastDocId || '');
      sessionStorage.setItem('articleListingHasMore', JSON.stringify(hasMore));
      sessionStorage.setItem('articleListingScrollPos', window.scrollY.toString());
    };

    const handleRouteChangeComplete = (url: string) => {
      // Clear saved state if it's a full page reload (not a back navigation)
      if (router.asPath === url && !router.isReady) {
        sessionStorage.removeItem('articleListingArticles');
        sessionStorage.removeItem('articleListingLastDocId');
        sessionStorage.removeItem('articleListingHasMore');
        sessionStorage.removeItem('articleListingScrollPos');
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    // Restore scroll position on mount if available
    if (typeof window !== 'undefined') {
      const savedScrollPos = sessionStorage.getItem('articleListingScrollPos');
      if (savedScrollPos) {
        window.scrollTo(0, parseInt(savedScrollPos, 10));
        sessionStorage.removeItem('articleListingScrollPos'); // Clear after restoring
      }
    }

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [displayedArticles, lastDocId, hasMore, router]);

  return (
    <Layout>
      <Head>
        <title>AI Career Insights &amp; Articles | AI Job Spot</title>
        <meta
          name="description"
          content="Explore insightful articles and expert guides on the AI job market, career development, and the future of artificial intelligence. Stay informed with AI Job Spot."
        />
        <meta name="keywords" content="AI careers, AI industry, machine learning articles, data science insights, AI technology trends" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="AI Career Insights & Articles | AI Job Spot" />
        <meta property="og:description" content="Explore insightful articles and expert guides on the AI job market, career development, and the future of artificial intelligence." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL}/articles`} />
      </Head>
      <div className="container mx-auto px-4 py-12 font-serif">
        <h1 className="text-5xl font-bold text-neutral-800 mb-6 text-center leading-tight">Insights & Musings</h1>
        <p className="text-xl text-neutral-600 mb-12 text-center max-w-2xl mx-auto">Delve into our curated collection of articles and guides on the evolving landscape of AI careers and technology.</p>
        {displayedArticles.length === 0 && !loading ? (
          <p className="text-center text-neutral-600 text-lg">No articles available at the moment. Please check back later for profound insights!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedArticles.map((article, index) => (
              <React.Fragment key={article.id}>
                <ArticleCard article={article} />
                {(index + 1) % 2 === 0 && index !== displayedArticles.length - 1 && (
                  <div className="lg:col-span-3 my-8">
                    <AdContainer slot={process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_LISTING_SLOT || ''} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {loading && (
          <p className="text-center text-neutral-600 mt-8">Loading more articles...</p>
        )}
        {!hasMore && !loading && displayedArticles.length > 0 && (
          <p className="text-center text-neutral-600 mt-8">You&apos;ve reached the end of the article listings.</p>
        )}
        <div ref={loader} className="h-1"></div> {/* Invisible element to observe */}
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<ArticlesProps> = async () => {
  try {
    const { articles, lastVisible } = await getArticles(ARTICLE_FETCH_LIMIT);

    return {
      props: {
        initialArticles: articles.map(article => ({
          ...article,
          publishDate: article.publishDate.toISOString(), // Convert Date to ISO string for serialization
        })),
        lastDocId: lastVisible ? lastVisible.id : null,
      },
      revalidate: 60, // In seconds
    };
  } catch (error) {
    console.error("Error fetching initial articles:", error);
    return {
      props: {
        initialArticles: [],
        lastDocId: null,
      },
      revalidate: 60,
    };
  }
};