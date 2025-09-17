import Layout from '@/components/Layout';
import { getArticles, getArticleBySlug } from '@/lib/firestoreClient'; // Import from firestoreClient
import { SerializedArticle } from '@/lib/types';
import Head from 'next/head';
import { formatDate } from '@/lib/dateUtils';
import Link from 'next/link';
import AdContainer from '@/components/AdContainer'; // Import AdContainer
import Image from 'next/image'; // Import the Next.js Image component

interface ArticlePageProps {
  article: SerializedArticle | null;
}

export async function getStaticPaths() {
  const { articles } = await getArticles(); // Destructure to get the articles array
  const paths = articles.map((article) => ({
    params: { slug: article.slug },
  }));

  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      article: {
        ...article,
        publishDate: article.publishDate ? article.publishDate.toISOString() : '', // Convert Date to ISO string, handle null
        imageUrl: article.imageUrl || null, // Ensure imageUrl is not undefined
        author_take_question1: article.author_take_question1 || null,
        author_take_answer1: article.author_take_answer1 || null,
        author_take_question2: article.author_take_question2 || null,
        author_take_answer2: article.author_take_answer2 || null,
      } as SerializedArticle,
    },
    revalidate: 60, // Re-generate page every 60 seconds
  };
}

export default function ArticlePage({ article }: ArticlePageProps) {
  if (!article) {
    return (
      <Layout>
        <Head>
          <title>Article Not Found | AI Job Spot</title>
        </Head>
        <div className="text-center py-10">
          <h1 className="text-3xl font-bold text-neutral-800 mb-4">Article Not Found</h1>
          <p className="text-neutral-600">The article you are looking for does not exist or has been moved.</p>
        </div>
      </Layout>
    );
  }

  const { title, author, publishDate, contentBody, issueNo, volumeNo, imageUrl } = article;

  return (
    <Layout>
      <Head>
        <title>{`${title} | AI Job Spot`}</title>
        <meta name="description" content={article.excerpt} />
        <meta name="author" content={author} />
        <meta name="keywords" content={article.tags.join(', ')} />
        <meta property="og:title" content={`${title} | AI Job Spot`} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL}/articles/${article.slug}`} />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL}/articles/${article.slug}`} />
        {article.imageUrl && <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL}${article.imageUrl}`} />}
      </Head>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {imageUrl && (
          <div className="mb-8">
            <Image
              src={imageUrl}
              alt={title}
              width={1200}
              height={675}
              priority
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        )}
        <h1 className="text-4xl font-serif font-extrabold text-primary-dark mb-4">{title}</h1>
        <div className="mb-6 border-b border-neutral-200 pb-4">
          <p className="text-neutral-700 text-base">
            By <span className="font-semibold text-primary-dark">{author}</span>
          </p>
          <hr className="border-t border-neutral-300 my-8" /> {/* Added subtle divider */}
          <p className="text-neutral-500 text-sm">
            {publishDate && `Published on ${formatDate(publishDate)}`}
            {(issueNo !== undefined && volumeNo !== undefined) && (
              <span className="ml-2">| Vol. {volumeNo}, Issue No. {issueNo}</span>
            )}
          </p>
        </div>
        <div className="prose prose-lg max-w-none font-sans text-neutral-800 leading-relaxed article-content" dangerouslySetInnerHTML={{ __html: contentBody }} />
        
        {author === 'The AI Strategist' && (
          <div className="mt-12 p-8 bg-neutral-50 rounded-lg shadow-sm border border-neutral-200">
            <h3 className="text-xl font-serif font-semibold text-primary-dark mb-4">About the Author</h3>
            <p className="text-neutral-700 italic leading-relaxed">
              The AI Strategist is the guiding voice of AI Job Spot, operating at the intersection of technology, philosophy, and long-term career architecture. The goal is not to report on fleeting trends, but to forge the durable mental models and actionable frameworks needed to build a defensible and meaningful career in the age of AI. <Link href="/about" className="text-secondary-dark hover:underline">Learn more about our mission</Link>.
            </p>
          </div>
        )}

        {/* Behind the Article Section */}
        {article.author_take_answer1 && (
          <section className="my-12 md:my-16">
            <div className="p-6 md:p-8 bg-secondary/5 rounded-lg border-l-4 border-secondary">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary-dark mb-8">Behind the Article</h2>
              <div className="space-y-8">
                {article.author_take_question1 && article.author_take_answer1 && (
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold font-serif text-primary/90">
                      {article.author_take_question1}
                    </h3>
                    <p className="mt-2 text-neutral-700 prose prose-lg max-w-none">
                      {article.author_take_answer1}
                    </p>
                  </div>
                )}
                {article.author_take_question2 && article.author_take_answer2 && (
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold font-serif text-primary/90">
                      {article.author_take_question2}
                    </h3>
                    <p className="mt-2 text-neutral-700 prose prose-lg max-w-none">
                      {article.author_take_answer2}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="my-12">
          <AdContainer slot={process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_CONTENT_SLOT || ''} />
        </div>
      </div>
    </Layout>
  );
}