import Layout from '@/components/Layout';
import ArticleCard from '@/components/ArticleCard';
import AdContainer from '@/components/AdContainer';
import { getArticles } from '@/lib/firestoreClient'; // Import from firestoreClient
import { Article } from '@/lib/types';
import { GetStaticProps } from 'next';
import Head from 'next/head';

export interface SerializedArticle extends Omit<Article, 'publishDate'> {
  publishDate: string;
}

// A more lightweight type for the article cards, excluding the full content.
export type SerializedArticleSummary = Omit<SerializedArticle, 'contentBody'>;

interface ArticlesProps {
  articles: SerializedArticleSummary[];
}

export default function Articles({ articles }: ArticlesProps) {
  console.log("Articles prop in Articles component:", articles);
  return (
    <Layout>
      <Head>
        <title>AI Career Insights & Articles | AI Job Spot</title>
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
        {articles.length === 0 ? (
          <p className="text-center text-neutral-600 text-lg">No articles available at the moment. Please check back later for profound insights!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <>
                <ArticleCard key={article.id} article={article} />
                {(index + 1) % 2 === 0 && index !== articles.length - 1 && (
                  <div className="lg:col-span-3 my-8">
                    <AdContainer slot={process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_LISTING_SLOT || ''} />
                  </div>
                )}
              </>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<ArticlesProps> = async () => {
  let articles: Article[] = [];
  try {
    articles = await getArticles();
    // Sort articles by publishDate in descending order (newest first)
    articles.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
  } catch (error) {
    console.error("Error fetching articles:", error);
  }

  console.log("Fetched articles in getStaticProps:", articles);

  return {
    props: {
      articles: articles.map(article => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { contentBody, ...articleSummary } = article;
        return {
          ...articleSummary,
          publishDate: article.publishDate.toISOString(), // Convert Date to ISO string for serialization
          imageUrl: article.imageUrl || null, // Ensure imageUrl is not undefined
        };
      }),
    },
    revalidate: 60, // In seconds
  };
};