import Layout from '@/components/Layout';
import {
  getArticles,
  getArticleBySlug,
  getJobsByTag,
  getJobsByIds,
} from '@/lib/firestoreAdminClient';
import {
  SerializedArticle,
  SerializedJobPosting,
  JobPosting,
} from '@/lib/types';
import Head from 'next/head';
import { formatDate } from '@/lib/dateUtils';
import Link from 'next/link';
import AdContainer from '@/components/AdContainer';
import Image from 'next/image';
import { authors, Author } from '@/lib/authors'; // Import authors data and type
import Sidebar from '@/components/Sidebar';

interface ArticlePageProps {
  article: SerializedArticle | null;
  authorBio: Author | null; // Add authorBio to props
  relevantJobs: SerializedJobPosting[];
}

const generateArticleSchema = (article: SerializedArticle) => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-job-spot.vercel.app';
  const logoUrl = `${siteUrl}/logo.svg`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/articles/${article.slug}`,
    },
    headline: article.title,
    description: article.excerpt,
    image: article.imageUrl ? `${siteUrl}${article.imageUrl}` : undefined,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AI Job Spot',
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
      },
    },
    datePublished: article.publishDate,
  };
};

export async function getStaticPaths() {
  const { articles } = await getArticles(100); // Fetch only 100 recent articles for static generation
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

  const serializeJobs = (jobs: JobPosting[]): SerializedJobPosting[] => {
    return jobs.map((job) => ({
      ...job,
      postedDate: job.postedDate ? new Date(job.postedDate).toISOString() : null,
      expirationDate: job.expirationDate
        ? new Date(job.expirationDate).toISOString()
        : null,
      verificationDate: job.verificationDate
        ? new Date(job.verificationDate).toISOString()
        : null,
      verificationHistory:
        job.verificationHistory?.map((e) => ({
          date: new Date(e.date).toISOString(),
          type: e.type,
          verifier: e.verifier ?? null,
          note: e.note ?? null,
        })) || [],
    }));
  };
  
  let relevantJobs: SerializedJobPosting[] = [];

  if (article.relatedJobIds && article.relatedJobIds.length > 0) {
    const jobs = await getJobsByIds(article.relatedJobIds);
    relevantJobs = serializeJobs(jobs);
  }

  // Fallback if no pre-computed relationships exist
  if (relevantJobs.length === 0) {
    const { jobs } = await getJobsByTag(article.tags || [], 5);
    relevantJobs = serializeJobs(jobs);
  }

  return {
    props: {
      article: {
        ...article,
        publishDate: article.publishDate
          ? article.publishDate.toISOString()
          : '',
        imageUrl: article.imageUrl || null,
        author_take_question1: article.author_take_question1 || null,
        author_take_answer1: article.author_take_answer1 || null,
        author_take_question2: article.author_take_question2 || null,
        author_take_answer2: article.author_take_answer2 || null,
      } as SerializedArticle,
      authorBio,
      relevantJobs,
    },
    revalidate: 60,
  };
}

export default function ArticlePage({
  article,
  authorBio,
  relevantJobs,
}: ArticlePageProps) {
  if (!article) {
    return (
      <Layout>
        <Head>
          <title>Article Not Found | AI Job Spot</title>
        </Head>
        <div className="text-center py-10">
          <h1 className="text-3xl font-bold text-neutral-800 mb-4">
            Article Not Found
          </h1>
          <p className="text-neutral-600">
            The article you are looking for does not exist or has been moved.
          </p>
        </div>
      </Layout>
    );
  }

  const {
    title,
    author,
    publishDate,
    contentBody,
    issueNo,
    volumeNo,
    imageUrl,
    hub,
  } = article;

  const canonicalUrl =
    article.contentType === 'briefing' && article.originalUrl
      ? article.originalUrl
      : `${process.env.NEXT_PUBLIC_SITE_URL}/articles/${article.slug}`;

  return (
    <Layout>
      <Head>
        <title>{`${title} | AI Job Spot`}</title>
        <meta name="description" content={article.excerpt || ''} />
        <meta name="author" content={author} />
        <meta name="keywords" content={article.tags.join(', ')} />
        <meta property="og:title" content={`${title} | AI Job Spot`} />
        <meta property="og:description" content={article.excerpt || ''} />
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content={`${process.env.NEXT_PUBLIC_SITE_URL}/articles/${article.slug}`}
        />
        <link
          rel="canonical"
          href={canonicalUrl}
        />
        {article.imageUrl && (
          <meta
            property="og:image"
            content={`${process.env.NEXT_PUBLIC_SITE_URL}${article.imageUrl}`}
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateArticleSchema(article)),
          }}
        />
      </Head>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 md:gap-x-12">
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
            <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-primary-dark mb-4">
              {title}
            </h1>
            {hub && (
              <div className="mb-4">
                <Link href={`/tags/${encodeURIComponent(hub.toLowerCase())}`} passHref>
                  <span className="inline-block border border-secondary/30 bg-secondary/10 text-secondary-dark text-sm font-semibold px-3 py-1 rounded-full uppercase tracking-wider cursor-pointer hover:bg-secondary-dark hover:text-white transition-colors">
                    {hub}
                  </span>
                </Link>
              </div>
            )}
            <div className="mb-6 border-b border-neutral-200 pb-4">
              <p className="text-neutral-700 text-base">
                By{' '}
                <span className="font-semibold text-primary-dark">
                  {author}
                </span>
              </p>
              <hr />
              <p className="text-neutral-500 text-sm">
                {publishDate && `Published on ${formatDate(publishDate)}`}
                {issueNo !== undefined && volumeNo !== undefined && (
                  <span className="ml-2">
                    | Vol. {volumeNo}, Issue No. {issueNo}
                  </span>
                )}
              </p>
            </div>

            {article.contentType === 'briefing' && article.originalUrl && article.sourceName && (
              <div className="my-8 p-4 bg-neutral-50/70 rounded-lg border border-neutral-200/80 text-neutral-700" role="alert">
                <p className="font-semibold">Content Source</p>
                <p className="text-sm">
                  This is a curated briefing. The original article was published on{' '}
                  <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-dark hover:underline">
                    {article.sourceName}
                  </a>.
                </p>
              </div>
            )}

            <div
              className="prose prose-base sm:prose-lg max-w-none font-sans text-neutral-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: contentBody || '' }}
            />

            <div className="mt-12 flex flex-wrap gap-2">
              {(article.tags || []).map((tag) => (
                <Link
                  href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                  key={tag}
                  className="border border-secondary/30 bg-secondary/10 text-secondary-dark text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-secondary-dark hover:text-white transition-colors duration-200"
                >
                  {tag}
                </Link>
              ))}
            </div>

            {authorBio && (
              <div className="mt-12 p-8 bg-primary/5 rounded-lg border border-primary/10">
                <h3 className="text-xl font-serif font-semibold text-primary-dark mb-2">
                  About {authorBio.name}
                </h3>
                <p className="text-neutral-600 text-sm mb-4">{authorBio.title}</p>
                <p className="text-neutral-700 italic leading-relaxed mb-4">
                  {authorBio.bio}{' '}
                  <Link
                    href={authorBio.link}
                    className="text-secondary-dark hover:underline"
                  >
                    {authorBio.linkText}
                  </Link>
                  .
                </p>
                {authorBio.socialLinks && (
                  <div className="flex space-x-4 mt-4">
                    {authorBio.socialLinks.twitter && (
                      <a
                        href={authorBio.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-500 hover:text-primary-dark transition-colors"
                      >
                        <svg fill="currentColor" viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                          <path d="M18.244 2.25h3.308l-7.227 8.26L21.61 21.75h-5.25l-4.55-6.27L8.25 21.75H2.924l7.393-8.426L2.25 2.25h5.084l3.988 5.483L18.244 2.25zm-4.77 15.315l3.493 4.43H14.5L8.106 6.288H5.99l8.234 11.277z" />
                        </svg>
                      </a>
                    )}
                    {authorBio.socialLinks.linkedin && (
                      <a
                        href={authorBio.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-500 hover:text-primary-dark transition-colors"
                      >
                        <svg fill="currentColor" viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                          <path d="M0 0h24v24H0z" fill="none" />
                          <path d="M19 0H5C2.239 0 0 2.239 0 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5V5c0-2.761-2.239-5-5-5zm-11 19H5V8h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zM19 19h-3v-4.737c0-1.136-.044-2.455-1.5-2.455-1.502 0-1.732 1.175-1.732 2.379V19h-3V8h3v1.387h.044c.48-.924 1.65-1.897 3.456-1.897 3.69 0 4.364 2.42 4.364 5.57V19z" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Behind the Article Section */}
            {article.author_take_answer1 && (
              <section className="my-12 md:my-16">
                <div className="p-6 md:p-8 bg-secondary/5 rounded-lg border border-secondary/20">
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
        </div>
      </div>
    </Layout>
  );
}