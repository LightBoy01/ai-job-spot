import React from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import AggregatedArticleCard from '@/components/AggregatedArticleCard';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { getAggregatedArticlesAdmin } from '@/lib/firebaseAdmin';
import { SerializedAggregatedArticle } from '@/lib/types';
import { GetStaticProps } from 'next';

interface NewsProps {
  articles: SerializedAggregatedArticle[];
}

export default function News({ articles }: NewsProps) {
  return (
    <Layout>
      <Head>
        <title>AI News Feed | AI Job Spot</title>
        <meta
          name="description"
          content="A curated feed of the latest news, articles, and insights in the world of Artificial Intelligence from around the web."
        />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="AI News Feed | AI Job Spot" />
        <meta
          property="og:description"
          content="A curated feed of the latest news, articles, and insights in the world of Artificial Intelligence from around the web."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`${process.env.NEXT_PUBLIC_SITE_URL}/news`}
        />
      </Head>
      <div className="container mx-auto px-4 py-12 font-serif">
        <h1 className="page-title mb-6">AI News Feed</h1>
        <p className="text-xl text-neutral-600 mb-12 text-center max-w-2xl mx-auto">
          A curated feed of the latest news, articles, and insights in the world of Artificial Intelligence from around the web.
        </p>
        {articles.length === 0 ? (
          <p className="text-center text-neutral-600 text-lg">
            No news articles found. Please check back later.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg::grid-cols-3 gap-10">
            {articles.map((article) => (
              <AggregatedArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<NewsProps> = async () => {
  try {
    const { adminDb } = await getFirebaseAdmin();
    const { articles } = await getAggregatedArticlesAdmin(adminDb, 30); // Fetch the 30 most recent

    return {
      props: {
        articles: articles.map((article) => ({
          ...article,
          publishDate: article.publishDate
            ? article.publishDate.toISOString()
            : null,
        })),
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error('Error fetching aggregated articles:', error);
    return {
      props: {
        articles: [],
      },
      revalidate: 60, // Revalidate every minute on error
    };
  }
};
