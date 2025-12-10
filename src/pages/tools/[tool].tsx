import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Layout from '@/components/Layout';
import JobCard from '@/components/JobCard';
import { getJobsByTag } from '@/lib/firestoreClient';
import { SerializedJobSummary } from '@/lib/types';
import AdContainer from '@/components/AdContainer';
import React, { useState, useCallback } from 'react';
import { useSessionScrollRestoration, getInitialStateFromSession, ScrollRestorationConfig } from '@/hooks/useSessionScrollRestoration';
import { smoothScrollToTop } from '@/lib/utils';
import Pagination from '@/components/Pagination';
import { getToolBySlug, getAllToolSlugs, ToolMetadata } from '@/lib/tools';
import Icon from '@/components/Icon';
import Link from 'next/link';

interface ToolPageProps {
  tool: ToolMetadata;
  initialJobs: SerializedJobSummary[];
  isBackfill: boolean;
  lastJobDocId: string | null;
}

const toolScrollConfig = (toolSlug: string): ScrollRestorationConfig => ({
    listKey: `toolJobs-${toolSlug}`,
    lastDocIdKey: `toolJobsLastDoc-${toolSlug}`,
    hasMoreKey: `toolJobsHasMore-${toolSlug}`,
    scrollPosKey: `toolJobsScrollPos-${toolSlug}`,
    pageKey: `toolJobsPage-${toolSlug}`,
    pageCursorsKey: `toolJobsPageCursors-${toolSlug}`,
    filtersKey: `toolJobsFilters-${toolSlug}`,
});

const ToolPage: NextPage<ToolPageProps> = ({
  tool,
  initialJobs,
  isBackfill,
  lastJobDocId: staticLastJobDocId,
}) => {
    const config = toolScrollConfig(tool.slug);

    const { 
        initialItems: sessionJobs, 
        initialLastDocId: sessionLastJobDocId, 
        initialHasMore: sessionHasMoreJobs,
        initialPage: initialJobPage,
        initialPageCursors: initialJobPageCursors,
    } = getInitialStateFromSession<SerializedJobSummary>(config);

  const [displayedJobs, setDisplayedJobs] = useState<SerializedJobSummary[]>(sessionJobs || initialJobs);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [hasMoreJobs, setHasMoreJobs] = useState(sessionHasMoreJobs !== null ? sessionHasMoreJobs : true);
  const [lastJobDocIdState, setLastJobDocIdState] = useState(sessionLastJobDocId || staticLastJobDocId);

  // Pagination State
  const [jobPage, setJobPage] = useState<number>(initialJobPage);
  const [jobCursors, setJobCursors] = useState<(string | null)[]>(initialJobPageCursors);

  const fetchJobs = useCallback(async (cursor: string | null) => {
    if (loadingJobs) return;
    setLoadingJobs(true);

    try {
      // Determine which tags to search for (primary or backfill)
      // Note: This simple pagination implementation assumes we stick to the initial mode (primary or backfill)
      // for the entire session. 
      const tagsToSearch = isBackfill ? tool.relatedTags.join(',') : tool.name;
      
      const response = await fetch(
        `/api/jobs/search?tags=${encodeURIComponent(tagsToSearch)}&startAfter=${cursor || ''}&limit=10`
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
  }, [loadingJobs, isBackfill, tool]);

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

  useSessionScrollRestoration({
    items: displayedJobs,
    lastDocId: lastJobDocIdState,
    hasMore: hasMoreJobs,
    page: jobPage,
    pageCursors: jobCursors,
    activeFilters: null, 
    config: config,
  });

  return (
    <Layout>
      <Head>
        <title>{`Hire ${tool.name} Experts & Developers | AI Job Spot`}</title>
        <meta
          name="description"
          content={`Find the best ${tool.name} jobs and freelance opportunities. ${tool.description.substring(0, 150)}...`}
        />
      </Head>
      
      {/* Hero / Definition Section */}
      <div className="bg-gradient-to-br from-primary/5 to-white border-b border-primary/10">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-neutral-200 mb-6">
                 {/* Placeholder for Tool Icon if we had one, using generic code icon for now */}
                 <Icon name="code" className="h-8 w-8 text-secondary" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-primary-dark mb-6">
                {tool.name} Jobs
            </h1>
            <p className="text-xl text-neutral-600 font-light max-w-3xl mx-auto leading-relaxed">
                {tool.description}
            </p>
            
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
                {tool.avgSalary && (
                    <div className="flex items-center bg-white px-4 py-2 rounded-full border border-neutral-200 shadow-sm">
                        <Icon name="salary" className="h-5 w-5 mr-2 text-green-600" />
                        <span className="font-semibold text-neutral-800">Avg. Salary: {tool.avgSalary}</span>
                    </div>
                )}
                <div className="flex items-center bg-white px-4 py-2 rounded-full border border-neutral-200 shadow-sm">
                    <Icon name="tag" className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="font-semibold text-neutral-800">Category: {tool.category}</span>
                </div>
            </div>

            {tool.whyLearn && (
                <div className="mt-10 bg-white/80 backdrop-blur-sm p-6 rounded-lg border border-neutral-200 max-w-2xl mx-auto">
                    <h3 className="text-lg font-serif font-semibold text-primary mb-2">Why Learn {tool.name}?</h3>
                    <p className="text-neutral-700">{tool.whyLearn}</p>
                </div>
            )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-neutral-200 pb-4">
            <div>
                 <h2 className="text-3xl font-serif font-bold text-primary-dark">
                    {isBackfill ? `Related AI Engineering Roles` : `Latest ${tool.name} Opportunities`}
                </h2>
                {isBackfill && (
                    <p className="text-neutral-500 mt-2">
                        We currently don't have open positions specifically tagged for <strong>{tool.name}</strong>, 
                        but these roles often require similar skills ({tool.relatedTags.join(', ')}).
                    </p>
                )}
            </div>
            
            {/* CTA for Talent Collective (Placeholder) */}
            <div className="mt-4 md:mt-0">
                <button className="bg-secondary/10 hover:bg-secondary/20 text-secondary-dark font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center">
                    <Icon name="bell" className="h-4 w-4 mr-2" />
                    Get {tool.name} Job Alerts
                </button>
            </div>
        </div>

        <div className="mt-8">
          {displayedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {displayedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6 bg-neutral-50/70 rounded-lg border border-neutral-200/80">
              <h3 className="text-xl font-serif text-primary-dark">No Jobs Found</h3>
              <p className="text-neutral-600 mt-2 max-w-md mx-auto">
                No matching jobs found at this time.
              </p>
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
        
        <div className="my-16 bg-primary-dark text-white rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
             {/* Abstract Background Shapes */}
             <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
             <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
             
             <div className="relative z-10 max-w-2xl mx-auto">
                 <h2 className="text-3xl font-serif font-bold mb-4">Are you a {tool.name} Expert?</h2>
                 <p className="text-primary-light text-lg mb-8">
                     Join our exclusive talent collective. Companies are looking for specialized skills like yours. 
                     Get matched with high-paying opportunities before they hit the public job boards.
                 </p>
                 <button className="bg-secondary hover:bg-secondary-light text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105">
                     Join the {tool.name} Talent Pool
                 </button>
             </div>
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
    // We pre-render nothing to save build time. 
    // All tool pages are generated on demand.
    return { paths: [], fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<
  ToolPageProps,
  { tool: string }
> = async (context) => {
  const toolSlug = context.params?.tool;

  if (!toolSlug) {
    return { notFound: true };
  }

  const toolMetadata = getToolBySlug(toolSlug);

  if (!toolMetadata) {
      // If the tool isn't in our registry, 404.
      // Alternatively, we could fallback to a generic tag search, but better to be explicit.
      return { notFound: true };
  }

  // 1. Try to find jobs specifically for this tool
  let { jobs, lastVisible: lastJobDoc } = await getJobsByTag([toolMetadata.name], 10);
  let isBackfill = false;

  // 2. If no jobs found (or very few), fallback to related tags
  if (jobs.length < 3) {
      const { jobs: backfillJobs, lastVisible: backfillLastDoc } = await getJobsByTag(toolMetadata.relatedTags, 10);
      if (backfillJobs.length > 0) {
          jobs = backfillJobs;
          lastJobDoc = backfillLastDoc;
          isBackfill = true;
      }
  }

  return {
    props: {
      tool: toolMetadata,
      initialJobs: jobs.map((job) => ({
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
        applicationLink: job.applicationLink,
      })),
      isBackfill,
      lastJobDocId: lastJobDoc ? lastJobDoc.id : null,
    },
    revalidate: 60,
  };
};

export default ToolPage;