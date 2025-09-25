import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import ArticleCard from '@/components/ArticleCard';
import AdContainer from '@/components/AdContainer';
import { getArticles } from '@/lib/firestoreClient';
import { SerializedArticleSummary } from '@/lib/types';
import { ARTICLE_FETCH_LIMIT } from '@/lib/constants';
import { GetStaticProps } from 'next';

interface ArticlesProps {
  initialArticles: SerializedArticleSummary[];
  lastDocId: string | null;
}

export default function Articles({
  initialArticles,
  lastDocId: initialLastDocId,
}: ArticlesProps) {
  const router = useRouter();

  const [displayedArticles, setDisplayedArticles] = useState<
    SerializedArticleSummary[]
  >(() => {
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
  const isFetching = React.useRef(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchArticles = useCallback(
    async (query: string, startAfterId: string | null) => {
      if (isFetching.current) return;

      isFetching.current = true;
      setLoading(true);

      const isNewSearch = startAfterId === null;
      const searchParams = new URLSearchParams({
        q: query,
        startAfter: startAfterId || '',
        limit: String(ARTICLE_FETCH_LIMIT),
      });

      try {
        const response = await fetch(
          `/api/articles/search?${searchParams.toString()}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch articles');
        }

        const { articles: newFetchedArticles, lastVisible: newLastVisible } =
          await response.json();

        if (newFetchedArticles.length < ARTICLE_FETCH_LIMIT) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        setDisplayedArticles((prevArticles) => {
          const existingIds = new Set(prevArticles.map((a) => a.id));
          const uniqueNewArticles = newFetchedArticles.filter(
            (a: SerializedArticleSummary) => !existingIds.has(a.id)
          );
          return isNewSearch
            ? newFetchedArticles
            : [...prevArticles, ...uniqueNewArticles];
        });
        setLastDocId(newLastVisible);
      } catch (error) {
        console.error('Error fetching articles:', error);
        setHasMore(false);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    },
    []
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim() === '') {
        setDisplayedArticles(initialArticles);
        setLastDocId(initialLastDocId);
        setHasMore(true);
      } else {
        fetchArticles(searchQuery, null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, initialArticles, initialLastDocId, fetchArticles]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const query = searchQuery.trim();
      fetchArticles(query, lastDocId);
    }
  };

  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      if (router.asPath === url) return;
      sessionStorage.setItem(
        'articleListingArticles',
        JSON.stringify(displayedArticles)
      );
      sessionStorage.setItem('articleListingLastDocId', lastDocId || '');
      sessionStorage.setItem('articleListingHasMore', JSON.stringify(hasMore));
      sessionStorage.setItem(
        'articleListingScrollPos',
        window.scrollY.toString()
      );
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);

    if (typeof window !== 'undefined') {
      const savedScrollPos = sessionStorage.getItem('articleListingScrollPos');
      if (savedScrollPos) {
        window.scrollTo(0, parseInt(savedScrollPos, 10));
        sessionStorage.removeItem('articleListingScrollPos');
      }
    }

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
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
        <meta
          name="keywords"
          content="AI careers, AI industry, machine learning articles, data science insights, AI technology trends"
        />
        <meta name="robots" content="index, follow" />
        <meta
          property="og:title"
          content="AI Career Insights & Articles | AI Job Spot"
        />
        <meta
          property="og:description"
          content="Explore insightful articles and expert guides on the AI job market, career development, and the future of artificial intelligence."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`${process.env.NEXT_PUBLIC_SITE_URL}/articles`}
        />
      </Head>
      <div className="container mx-auto px-4 py-12 font-serif">
        <h1 className="page-title mb-6">Insights & Musings</h1>
        <p className="text-xl text-neutral-600 mb-12 text-center max-w-2xl mx-auto">
          Delve into our curated collection of articles and guides on the
          evolving landscape of AI careers and technology.
        </p>
        <div className="mb-12 flex justify-center">
          <input
            type="text"
            placeholder="Search by title, author, or tags..."
            className="w-full max-w-lg p-4 border border-neutral-300 rounded-lg"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        {displayedArticles.length === 0 && !loading ? (
          <p className="text-center text-neutral-600 text-lg">
            No articles found. Please check back later or refine your search.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {displayedArticles.map((article, index) => (
              <React.Fragment key={article.id}>
                <ArticleCard article={article} />
                {(index + 1) % 2 === 0 &&
                  index !== displayedArticles.length - 1 && (
                    <div className="lg:col-span-3 my-8">
                      <AdContainer
                        slot={
                          process.env
                            .NEXT_PUBLIC_ADSENSE_ARTICLE_LISTING_SLOT || ''
                        }
                      />
                    </div>
                  )}
              </React.Fragment>
            ))}
          </div>
        )}
        <div className="text-center mt-12">
          {loading ? (
            <p className="text-neutral-600">Loading more articles...</p>
          ) : hasMore ? (
            <button
              onClick={loadMore}
              className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-primary-dark transition-colors duration-300"
            >
              Load More
            </button>
          ) : (
            <p className="text-neutral-600">
              You&apos;ve reached the end of the article listings.
            </p>
          )}
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
          ...article,
          publishDate: article.publishDate
            ? article.publishDate.toISOString()
            : '',
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
