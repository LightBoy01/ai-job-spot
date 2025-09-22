import Layout from '@/components/Layout';
import { getArticles, getArticleBySlug } from '@/lib/firestoreClient';
import { SerializedArticle } from '@/lib/types';
import Head from 'next/head';
import { formatDate } from '@/lib/dateUtils';
import Link from 'next/link';
import AdContainer from '@/components/AdContainer';
import Image from 'next/image';
import { authors, Author } from '@/lib/authors'; // Import authors data and type

interface ArticlePageProps {
  article: SerializedArticle | null;
  authorBio: Author | null; // Add authorBio to props
}

const generateArticleSchema = (article: SerializedArticle) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-job-spot.vercel.app';
  const logoUrl = `${siteUrl}/logo.svg`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `${siteUrl}/articles/${article.slug}`,
    },
    'headline': article.title,
    'description': article.excerpt,
    'image': article.imageUrl ? `${siteUrl}${article.imageUrl}` : undefined,
    'author': {
      '@type': 'Person',
      'name': article.author,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'AI Job Spot',
      'logo': {
        '@type': 'ImageObject',
        'url': logoUrl,
      },
    },
    'datePublished': article.publishDate,
  };
};

export async function getStaticPaths() {
  const { articles } = await getArticles();
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

  const authorBio = authors[article.author] || null;

  return {
    props: {
      article: {
        ...article,
        publishDate: article.publishDate ? article.publishDate.toISOString() : '',
        imageUrl: article.imageUrl || null,
        author_take_question1: article.author_take_question1 || null,
        author_take_answer1: article.author_take_answer1 || null,
        author_take_question2: article.author_take_question2 || null,
        author_take_answer2: article.author_take_answer2 || null,
      } as SerializedArticle,
      authorBio,
    },
    revalidate: 60,
  };
}

export default function ArticlePage({ article, authorBio }: ArticlePageProps) {
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateArticleSchema(article)) }}
        />
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
        <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-primary-dark mb-4">{title}</h1>
        <div className="mb-6 border-b border-neutral-200 pb-4">
          <p className="text-neutral-700 text-base">
            By <span className="font-semibold text-primary-dark">{author}</span>
          </p>
          <hr className="border-t border-neutral-300 my-8" />
          <p className="text-neutral-500 text-sm">
            {publishDate && `Published on ${formatDate(publishDate)}`}
            {(issueNo !== undefined && volumeNo !== undefined) && (
              <span className="ml-2">| Vol. {volumeNo}, Issue No. {issueNo}</span>
            )}
          </p>
        </div>
          <div className="md:col-span-2">
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
            <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-primary-dark mb-4">{title}</h1>
            <div className="mb-6 border-b border-neutral-200 pb-4">
              <p className="text-neutral-700 text-base">
                By <span className="font-semibold text-primary-dark">{author}</span>
              </p>
              <hr className="border-t border-neutral-300 my-8" />
              <p className="text-neutral-500 text-sm">
                {publishDate && `Published on ${formatDate(publishDate)}`}
                {(issueNo !== undefined && volumeNo !== undefined) && (
                  <span className="ml-2">| Vol. {volumeNo}, Issue No. {issueNo}</span>
                )}
              </p>
            </div>
            <div className="prose prose-base sm:prose-lg max-w-none font-sans text-neutral-800 leading-relaxed article-content" dangerouslySetInnerHTML={{ __html: contentBody }} />
            
            {authorBio && (
              <div className="mt-12 p-8 bg-neutral-50 rounded-lg shadow-sm border border-neutral-200">
                <h3 className="text-xl font-serif font-semibold text-primary-dark mb-4">About {authorBio.name}</h3>
                <p className="text-neutral-700 italic leading-relaxed">
                  {authorBio.bio} <Link href={authorBio.link} className="text-secondary-dark hover:underline">{authorBio.linkText}</Link>.
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
          <aside className="md:col-span-1">
            <Sidebar title="Relevant Jobs" items={relevantJobs} />
          </aside>