import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Layout from '@/components/Layout';
import JobCard from '@/components/JobCard';
import { getJobsByLocation } from '@/lib/firestoreClient';
import { SerializedJobSummary } from '@/lib/types';
import AdContainer from '@/components/AdContainer';
import React, { useState, useCallback } from 'react';
import { useSessionScrollRestoration, getInitialStateFromSession, ScrollRestorationConfig } from '@/hooks/useSessionScrollRestoration';
import { smoothScrollToTop } from '@/lib/utils';
import Pagination from '@/components/Pagination';

interface LocationPageProps {
  location: string;
  initialJobs: SerializedJobSummary[];
  lastJobDocId: string | null;
}

const locationScrollConfig = (location: string): ScrollRestorationConfig => ({
    listKey: `locationJobs-${location}`,
    lastDocIdKey: `locationJobsLastDoc-${location}`,
    hasMoreKey: `locationJobsHasMore-${location}`,
    scrollPosKey: `locationJobsScrollPos-${location}`,
    pageKey: `locationJobsPage-${location}`,
    pageCursorsKey: `locationJobsPageCursors-${location}`,
    filtersKey: `locationJobsFilters-${location}`,
});

const LocationPage: NextPage<LocationPageProps> = ({
  location,
  initialJobs,
  lastJobDocId: staticLastJobDocId,
}) => {
    const config = locationScrollConfig(location);

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
      const response = await fetch(
        `/api/jobs/search?location=${encodeURIComponent(location)}&startAfter=${cursor || ''}&limit=10`
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
  }, [loadingJobs, location]);

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
        <title>{`AI Jobs in ${location} | AI Job Spot`}</title>
        <meta
          name="description"
          content={`Find the latest AI, Machine Learning, and Data Science jobs in ${location}.`}
        />
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="page-title text-4xl sm:text-5xl md:text-6xl mb-4">
          AI Jobs in {location}
        </h1>
        <p className="mt-2 text-lg text-neutral-600 font-sans max-w-2xl mx-auto">
          Explore the latest opportunities in Artificial Intelligence and Machine Learning located in {location}.
        </p>
        <div className="mt-12 text-left">
          {displayedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {displayedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6 bg-neutral-50/70 rounded-lg border border-neutral-200/80">
              <h3 className="text-xl font-serif text-primary-dark">No Jobs Found</h3>
              <p className="text-neutral-600 mt-2 max-w-md mx-auto">There are currently no open positions in this location. Please check back later.</p>
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
      </div>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [], fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<
  LocationPageProps,
  { location: string }
> = async (context) => {
  const location = context.params?.location;

  if (!location) {
    return { notFound: true };
  }
  
  const decodedLocation = decodeURIComponent(location);

  const { jobs, lastVisible: lastJobDoc } = await getJobsByLocation(decodedLocation, 10);

  return {
    props: {
      location: decodedLocation,
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
      lastJobDocId: lastJobDoc ? lastJobDoc.id : null,
    },
    revalidate: 60,
  };
};

export default LocationPage;