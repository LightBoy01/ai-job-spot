import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Layout from '@/components/Layout';
import JobCard from '@/components/JobCard';
import ArticleCard from '@/components/ArticleCard';
import { getAllTags, getJobsByTag, getArticlesByTag } from '@/lib/firestoreClient';
import { SerializedJobPosting, SerializedArticleSummary } from '@/lib/types';

interface TagPageProps {
  tag: string;
  jobs: SerializedJobPosting[];
  articles: SerializedArticleSummary[];
}

const TagPage: NextPage<TagPageProps> = ({ tag, jobs, articles }) => {
  return (
    <Layout>
      <Head>
        <title>{`Content tagged with "${tag}" | AI Job Spot`}</title>
        <meta name="description" content={`Find the latest jobs and articles related to ${tag}.`} />
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="page-title text-4xl sm:text-5xl md:text-6xl mb-4">#{tag}</h1>
        <div className="mt-12">
          <h2 className="text-3xl font-serif font-bold text-primary-dark mb-6">Jobs</h2>
          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <p className="text-neutral-600">No jobs found for this tag.</p>
          )}
        </div>
        <div className="mt-12">
          <h2 className="text-3xl font-serif font-bold text-primary-dark mb-6">Articles</h2>
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <p className="text-neutral-600">No articles found for this tag.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const tags = await getAllTags();
  const paths = tags.map((tag) => ({
    params: { tag },
  }));

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<TagPageProps, { tag: string }> = async (context) => {
  const tag = context.params?.tag;

  if (!tag) {
    return { notFound: true };
  }

  const jobs = await getJobsByTag(tag);
  const articles = await getArticlesByTag(tag);

  return {
    props: {
      tag,
      jobs: jobs.map(job => ({
        ...job,
        postedDate: job.postedDate.toISOString(),
        expirationDate: job.expirationDate ? job.expirationDate.toISOString() : null,
      })),
      articles: articles.map(article => ({
        ...article,
        publishDate: article.publishDate ? article.publishDate.toISOString() : '',
      })),
    },
    revalidate: 60,
  };
};

export default TagPage;
