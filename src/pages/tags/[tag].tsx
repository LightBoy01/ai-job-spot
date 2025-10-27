import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Layout from '@/components/Layout';
import JobCard from '@/components/JobCard';
import ArticleCard from '@/components/ArticleCard';
import { getAllTags, getJobsByTag, getArticlesByTag } from '@/lib/firestoreClient';
import { SerializedArticleSummary, SerializedJobSummary } from '@/lib/types';
import AdContainer from '@/components/AdContainer';
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TagPageProps {
  tag: string;
  initialJobs: SerializedJobSummary[];
  initialArticles: SerializedArticleSummary[];
  lastJobDocId: string | null;
  lastArticleDocId: string | null;
}

const TagPage: NextPage<TagPageProps> = ({
  tag,
  initialJobs,
  initialArticles,
  lastJobDocId,
  lastArticleDocId,
}) => {
  const [displayedJobs, setDisplayedJobs] = useState<SerializedJobSummary[]>(initialJobs);
  const [displayedArticles, setDisplayedArticles] = useState(initialArticles);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);
  const [hasMoreArticles, setHasMoreArticles] = useState(true);
  const [lastJobDocIdState, setLastJobDocIdState] = useState(lastJobDocId);
  const [lastArticleDocIdState, setLastArticleDocIdState] = useState(lastArticleDocId);

  const jobLoader = useRef(null);
  const articleLoader = useRef(null);

  const fetchMoreJobs = useCallback(async () => {
    if (loadingJobs || !hasMoreJobs) return;
    setLoadingJobs(true);

    try {
      const response = await fetch(
        `/api/tags/jobs/paginate?tag=${tag}&startAfter=${lastJobDocIdState || ''}`
      );
      const data = await response.json();

      if (data.jobs.length === 0) {
        setHasMoreJobs(false);
      } else {
        setDisplayedJobs((prev) => [...prev, ...data.jobs]);
        setLastJobDocIdState(data.lastVisible);
      }
    } catch (error) {
      console.error('Error fetching more jobs:', error);
      setHasMoreJobs(false);
    } finally {
      setLoadingJobs(false);
    }
  }, [loadingJobs, hasMoreJobs, lastJobDocIdState, tag]);

  const fetchMoreArticles = useCallback(async () => {
    if (loadingArticles || !hasMoreArticles) return;
    setLoadingArticles(true);

    try {
      const response = await fetch(
        `/api/tags/articles/paginate?tag=${tag}&startAfter=${lastArticleDocIdState || ''}`
      );
      const data = await response.json();

      if (data.articles.length === 0) {
        setHasMoreArticles(false);
      } else {
        setDisplayedArticles((prev) => [...prev, ...data.articles]);
        setLastArticleDocIdState(data.lastVisible);
      }
    } catch (error) {
      console.error('Error fetching more articles:', error);
      setHasMoreArticles(false);
    } finally {
      setLoadingArticles(false);
    }
  }, [loadingArticles, hasMoreArticles, lastArticleDocIdState, tag]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMoreJobs();
        }
      },
      { threshold: 1 }
    );
    const currentJobLoader = jobLoader.current;
    if (currentJobLoader) {
      observer.observe(currentJobLoader);
    }
    return () => {
      if (currentJobLoader) {
        observer.unobserve(currentJobLoader);
      }
    };
  }, [fetchMoreJobs]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMoreArticles();
        }
      },
      { threshold: 1 }
    );
    const currentArticleLoader = articleLoader.current;
    if (currentArticleLoader) {
      observer.observe(currentArticleLoader);
    }
    return () => {
      if (currentArticleLoader) {
        observer.unobserve(currentArticleLoader);
      }
    };
  }, [fetchMoreArticles]);

  return (
    <Layout>
      <Head>
        <title>{`Content tagged with "${tag}" | AI Job Spot`}</title>
        <meta
          name="description"
          content={`Find the latest jobs and articles related to ${tag}.`}
        />
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="page-title text-4xl sm:text-5xl md:text-6xl mb-4">
          #{tag}
        </h1>
        <div className="mt-12">
          <h2 className="text-3xl font-serif font-bold text-primary-dark mb-6">
            Jobs
          </h2>
          {displayedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {displayedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <p className="text-neutral-600">No jobs found for this tag.</p>
          )}
          {loadingJobs && (
            <p className="text-center text-neutral-600 mt-8">
              Loading more jobs...
            </p>
          )}
          {!hasMoreJobs && displayedJobs.length > 0 && (
            <p className="text-center text-neutral-600 font-serif text-lg mt-8 pt-8 border-t border-neutral-200">
              You&apos;ve reached the end of the job listings for this tag.
            </p>
          )}
          <div ref={jobLoader} className="h-1"></div>
        </div>
        <div className="my-12">
          <AdContainer
            slot={process.env.NEXT_PUBLIC_ADSENSE_TAG_PAGE_SLOT || ''}
          />
        </div>
        <div className="mt-12">
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
            <p className="text-neutral-600">No articles found for this tag.</p>
          )}
          {loadingArticles && (
            <p className="text-center text-neutral-600 mt-8">
              Loading more articles...
            </p>
          )}
          {!hasMoreArticles && displayedArticles.length > 0 && (
            <p className="text-center text-neutral-600 font-serif text-lg mt-8 pt-8 border-t border-neutral-200">
              You&apos;ve reached the end of the article listings for this tag.
            </p>
          )}
          <div ref={articleLoader} className="h-1"></div>
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
  const tags = await getAllTags();
  const paths = tags.map((tag) => ({
    params: { tag },
  }));

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<
  TagPageProps,
  { tag: string }
> = async (context) => {
  const tag = context.params?.tag;

  if (!tag) {
    return { notFound: true };
  }

  const { jobs, lastVisible: lastJobDoc } = await getJobsByTag([tag], 10);
  const { articles, lastVisible: lastArticleDoc } = await getArticlesByTag([tag], 10);

  return {
    props: {
      tag,
      initialJobs: jobs.map((job) => ({
        // Only include fields used by JobCard
        id: job.id!,
        title: job.title,
        company: job.company,
        location: job.location,
        salaryRange: job.salaryRange ?? null,
        isNew: job.isNew ?? false,
        isFeatured: job.isFeatured ?? false,
        companyLogoUrl: job.companyLogoUrl ?? null,
        verificationDate: job.verificationDate ? job.verificationDate.toISOString() : null,
        sourceUrl: job.sourceUrl ?? null,
        jobLevel: job.jobLevel ?? null,
        source: job.source ?? null,
        tags: job.tags ?? [],
        postedDate: job.postedDate ? job.postedDate.toISOString() : null,
        expirationDate: job.expirationDate ? job.expirationDate.toISOString() : null,
        applicationLink: job.applicationLink, // <-- ADDED THIS LINE
      })),
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
      lastJobDocId: lastJobDoc ? lastJobDoc.id : null,
      lastArticleDocId: lastArticleDoc ? lastArticleDoc.id : null,
    },
    revalidate: 60,
  };
};

export default TagPage;