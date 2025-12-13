import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Layout from '@/components/Layout';
import JobCard from '@/components/JobCard';
import ArticleCard from '@/components/ArticleCard';
import { getJobsByTag, getArticlesByTag } from '@/lib/firestoreClient';
import { SerializedArticleSummary, SerializedJobSummary } from '@/lib/types';
import AdContainer from '@/components/AdContainer';
import React, { useState, useCallback } from 'react';
import { useSessionScrollRestoration, getInitialStateFromSession, ScrollRestorationConfig } from '@/hooks/useSessionScrollRestoration';
import { smoothScrollToTop } from '@/lib/utils';
import Pagination from '@/components/Pagination';

interface TagPageProps {
  tag: string;
  initialJobs: SerializedJobSummary[];
  initialArticles: SerializedArticleSummary[];
  lastJobDocId: string | null;
  lastArticleDocId: string | null;
}

const tagScrollConfig = (tag: string): { jobs: ScrollRestorationConfig, articles: ScrollRestorationConfig } => ({
    jobs: {
        listKey: `tagJobs-${tag}`,
        lastDocIdKey: `tagJobsLastDoc-${tag}`,
        hasMoreKey: `tagJobsHasMore-${tag}`,
        scrollPosKey: `tagJobsScrollPos-${tag}`,
        pageKey: `tagJobsPage-${tag}`,
        pageCursorsKey: `tagJobsPageCursors-${tag}`,
        filtersKey: `tagJobsFilters-${tag}`,
    },
    articles: {
        listKey: `tagArticles-${tag}`,
        lastDocIdKey: `tagArticlesLastDoc-${tag}`,
        hasMoreKey: `tagArticlesHasMore-${tag}`,
        scrollPosKey: `tagArticlesScrollPos-${tag}`,
        pageKey: `tagArticlesPage-${tag}`,
        pageCursorsKey: `tagArticlesPageCursors-${tag}`,
        filtersKey: `tagArticlesFilters-${tag}`,
    }
});

const TagPage: NextPage<TagPageProps> = ({
  tag,
  initialJobs,
  initialArticles,
  lastJobDocId: staticLastJobDocId,
  lastArticleDocId: staticLastArticleDocId,
}) => {
    const config = tagScrollConfig(tag);

    const { 
        initialItems: sessionJobs, 
        initialLastDocId: sessionLastJobDocId, 
        initialHasMore: sessionHasMoreJobs,
        initialPage: initialJobPage,
        initialPageCursors: initialJobPageCursors,
    } = getInitialStateFromSession<SerializedJobSummary>(config.jobs);

    const { 
        initialItems: sessionArticles, 
        initialLastDocId: sessionLastArticleDocId, 
        initialHasMore: sessionHasMoreArticles,
        initialPage: initialArticlePage,
        initialPageCursors: initialArticlePageCursors,
    } = getInitialStateFromSession<SerializedArticleSummary>(config.articles);


  const [displayedJobs, setDisplayedJobs] = useState<SerializedJobSummary[]>(sessionJobs || initialJobs);
  const [displayedArticles, setDisplayedArticles] = useState(sessionArticles || initialArticles);
  
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingArticles, setLoadingArticles] = useState(false);
  
  const [hasMoreJobs, setHasMoreJobs] = useState(sessionHasMoreJobs !== null ? sessionHasMoreJobs : true);
  const [hasMoreArticles, setHasMoreArticles] = useState(sessionHasMoreArticles !== null ? sessionHasMoreArticles : true);
  
  const [lastJobDocIdState, setLastJobDocIdState] = useState(sessionLastJobDocId || staticLastJobDocId);
  const [lastArticleDocIdState, setLastArticleDocIdState] = useState(sessionLastArticleDocId || staticLastArticleDocId);

  // Pagination State for Jobs
  const [jobPage, setJobPage] = useState<number>(initialJobPage);
  const [jobCursors, setJobCursors] = useState<(string | null)[]>(initialJobPageCursors);

  // Pagination State for Articles
  const [articlePage, setArticlePage] = useState<number>(initialArticlePage);
  const [articleCursors, setArticleCursors] = useState<(string | null)[]>(initialArticlePageCursors);

  const fetchJobs = useCallback(async (cursor: string | null) => {
    if (loadingJobs) return;
    setLoadingJobs(true);

    try {
      const response = await fetch(
        `/api/tags/jobs/paginate?tag=${tag}&startAfter=${cursor || ''}`
      );
      const data = await response.json();

      if (data.jobs.length === 0) {
        setHasMoreJobs(false);
        setDisplayedJobs([]);
      } else {
        setDisplayedJobs(data.jobs);
        setLastJobDocIdState(data.lastVisible);
      }
    } catch (error) {
      console.error('Error fetching more jobs:', error);
      setHasMoreJobs(false);
    } finally {
      setLoadingJobs(false);
      smoothScrollToTop(1200);
    }
  }, [loadingJobs, tag]);

  const fetchArticles = useCallback(async (cursor: string | null) => {
    if (loadingArticles) return;
    setLoadingArticles(true);

    try {
      const response = await fetch(
        `/api/tags/articles/paginate?tag=${tag}&startAfter=${cursor || ''}`
      );
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
  }, [loadingArticles, tag]);

  const handleNextJobPage = useCallback(() => {
      if (!lastJobDocIdState) return;
      setJobCursors(prev => [...prev, lastJobDocIdState]);
      setJobPage(prev => prev + 1);
      fetchJobs(lastJobDocIdState);
  }, [lastJobDocIdState, fetchJobs]);

  const handlePrevJobPage = useCallback(() => {
      if (jobPage <= 1) return;
      const newPage = jobPage - 1;
      const prevCursor = jobCursors[newPage - 1];
      setJobCursors(prev => prev.slice(0, -1));
      setJobPage(newPage);
      fetchJobs(prevCursor);
  }, [jobPage, jobCursors, fetchJobs]);

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


  // Apply session restoration for both lists
  useSessionScrollRestoration({
    items: displayedJobs,
    lastDocId: lastJobDocIdState,
    hasMore: hasMoreJobs,
    page: jobPage,
    pageCursors: jobCursors,
    activeFilters: null, 
    config: config.jobs,
  });

  useSessionScrollRestoration({
      items: displayedArticles,
      lastDocId: lastArticleDocIdState,
      hasMore: hasMoreArticles,
      page: articlePage,
      pageCursors: articleCursors,
      activeFilters: null,
      config: config.articles
  });

  return (
    <Layout>
      <Head>
        <title>{`Content tagged with "${tag}" | AI Job Spot`}</title>
        <meta
          name="description"
          content={`Explore top ${tag} jobs and articles. Your #1 resource for ${tag} careers in the AI industry.`}
        />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL}/tags/${encodeURIComponent(tag)}`} />
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="page-title text-4xl sm:text-5xl md:text-6xl mb-4">
          #{tag}
        </h1>
        <p className="mt-2 text-lg text-neutral-600 font-sans max-w-2xl mx-auto">
          Discover the latest {tag} job opportunities and expert insights. Curated for professionals shaping the future of AI.
        </p>
        <div className="mt-12 text-left">
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
            <div className="text-center py-16 px-6 bg-neutral-50/70 rounded-lg border border-neutral-200/80">
              <h3 className="text-xl font-serif text-primary-dark">No Matching Jobs</h3>
              <p className="text-neutral-600 mt-2 max-w-md mx-auto">There are currently no open positions for this tag. Please check back later or explore our other hubs.</p>
            </div>
          )}
          
          <Pagination
            currentPage={jobPage}
            hasPrevious={jobPage > 1}
            hasNext={hasMoreJobs}
            onPrevious={handlePrevJobPage}
            onNext={handleNextJobPage}
            isLoading={loadingJobs}
          />
        </div>
        <div className="my-12">
          <AdContainer
            slot={process.env.NEXT_PUBLIC_ADSENSE_TAG_PAGE_SLOT || ''}
          />
        </div>

        <hr className="my-16 border-t border-neutral-200/80" />

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
            <div className="text-center py-16 px-6 bg-neutral-50/70 rounded-lg border border-neutral-200/80">
              <h3 className="text-xl font-serif text-primary-dark">No Matching Articles</h3>
              <p className="text-neutral-600 mt-2 max-w-md mx-auto">There are currently no articles or briefings for this tag. Please check back later or explore our other hubs.</p>
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
  // Optimization: Do not pre-render any tag pages to save build time and database quota.
  // Pages will be generated on-demand via fallback: 'blocking'.
  return { paths: [], fallback: 'blocking' };
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