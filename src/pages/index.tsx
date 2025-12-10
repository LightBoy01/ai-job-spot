import React, { useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import JobCard from '@/components/JobCard';
import AdContainer from '@/components/AdContainer';
import { getJobsServer } from '@/lib/firestoreServer';
import { SerializedJobPosting } from '@/lib/types';
import { NEW_JOB_THRESHOLD_MS, JOB_FETCH_LIMIT } from '@/lib/constants';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useSessionScrollRestoration, getInitialStateFromSession, ScrollRestorationConfig } from '@/hooks/useSessionScrollRestoration';
import JobSearchBar from '@/components/JobSearchBar';
import Pagination from '@/components/Pagination';
import { smoothScrollToTop } from '@/lib/utils';

const jobScrollConfig: ScrollRestorationConfig = {
  listKey: 'jobListingJobs',
  lastDocIdKey: 'jobListingLastDocId',
  hasMoreKey: 'jobListingHasMore',
  scrollPosKey: 'jobListingScrollPos',
  pageKey: 'jobListingPage',
  pageCursorsKey: 'jobListingPageCursors',
  filtersKey: 'jobListingFilters',
};

interface HomeProps {
  initialJobs: SerializedJobPosting[];
  lastDocId: string | null;
}

const generateJobListSchema = (jobs: SerializedJobPosting[]) => {
  const itemListElement = jobs.map((job, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'JobPosting',
      '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/jobs/${job.id}`,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/jobs/${job.id}`,
      title: job.title,
      datePosted: job.postedDate,
      hiringOrganization: {
        '@type': 'Organization',
        name: job.company,
        logo: job.companyLogoUrl,
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: job.location.split(',')[0]?.trim(),
          addressRegion: job.location.split(',')[1]?.trim(),
          addressCountry: job.location.split(',')[2]?.trim(),
        },
      },
      baseSalary: job.salaryRange ? {
        '@type': 'MonetaryAmount',
        currency: job.salaryRange.match(/[A-Z]{3}|[$€₹£]/)?.[0] || 'USD',
        value: {
          '@type': 'QuantitativeValue',
          unitText: 'YEAR',
          minValue: job.salaryRange.match(/\d+/g)?.map(Number)[0],
          maxValue: job.salaryRange.match(/\d+/g)?.map(Number)[1],
        }
      } : undefined,
      description: job.description.substring(0, 200).replace(/<[^>]*>?/gm, '') + '...',
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI Job Postings',
    description: 'A list of the latest job opportunities in Artificial Intelligence.',
    itemListElement,
  };
};

export default function Home({
  initialJobs: staticJobs,
  lastDocId: staticLastDocId,
}: HomeProps) {
  const {
    initialItems: sessionJobs,
    initialLastDocId: sessionLastDocId,
    initialHasMore: sessionHasMore,
    initialPage,
    initialPageCursors,
    initialFilters,
  } = getInitialStateFromSession<SerializedJobPosting>(jobScrollConfig);

  const [displayedJobs, setDisplayedJobs] = useState<SerializedJobPosting[]>(
    sessionJobs || staticJobs
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(
    sessionHasMore !== null ? sessionHasMore : true
  );
  const [lastDocId, setLastDocId] = useState<string | null>(
    sessionLastDocId || staticLastDocId
  );
  
  // Pagination State
  const [page, setPage] = useState<number>(initialPage);
  const [pageCursors, setPageCursors] = useState<(string | null)[]>(initialPageCursors);

  const isFetching = React.useRef(false);
  const [activeFilters, setActiveFilters] = useState(initialFilters || { query: '', location: '', jobLevel: '', tags: '', sortOrder: 'desc' });

  const fetchAndDisplayJobs = useCallback(async (
    cursor: string | null,
    filters: { query: string; location: string; jobLevel: string; tags: string; sortOrder: string }
  ) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);

    const searchParams = new URLSearchParams({
      limit: String(JOB_FETCH_LIMIT),
    });
    if (cursor) searchParams.append('startAfter', cursor);
    if (filters.query) searchParams.append('q', filters.query);
    if (filters.location) searchParams.append('location', filters.location);
    if (filters.jobLevel) searchParams.append('jobLevel', filters.jobLevel);
    if (filters.tags) searchParams.append('tags', filters.tags);
    if (filters.sortOrder) searchParams.append('sortOrder', filters.sortOrder);

    try {
      const response = await fetch(`/api/jobs/search?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');

      const { jobs: newFetchedJobs = [], lastVisible: newLastVisible } = await response.json();

      setDisplayedJobs(newFetchedJobs);
      setLastDocId(newLastVisible);
      setHasMore(newFetchedJobs.length === JOB_FETCH_LIMIT);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setHasMore(false);
      setDisplayedJobs([]); 
    } finally {
      setLoading(false);
      isFetching.current = false;
      // Scroll to top of list when page changes
      smoothScrollToTop(1200); // Gentle 1.2s scroll
    }
  }, []);

  const handleNextPage = useCallback(() => {
    if (!lastDocId) return;
    
    // Save current cursor stack
    setPageCursors((prev) => [...prev, lastDocId]);
    setPage((prev) => prev + 1);
    
    fetchAndDisplayJobs(lastDocId, activeFilters);
  }, [lastDocId, fetchAndDisplayJobs, activeFilters]);

  const handlePrevPage = useCallback(() => {
    if (page <= 1) return;

    // Get the cursor for the previous page (index = page - 2 because page is 1-based and we want the cursor that STARTED the previous page)
    // Actually, to fetch Page (N-1), we need the cursor that was at the end of Page (N-2).
    // pageCursors[0] = null (start of Page 1)
    // pageCursors[1] = end of Page 1 (start of Page 2)
    // If we are on Page 2, we want to go to Page 1. Start cursor is pageCursors[0] (null).
    // If we are on Page 3, we want to go to Page 2. Start cursor is pageCursors[1].
    // So for new page P_new = P_current - 1, we want pageCursors[P_new - 1].
    
    const newPage = page - 1;
    const prevCursor = pageCursors[newPage - 1]; // Because page is 1-based

    setPageCursors((prev) => prev.slice(0, -1)); // Remove the last cursor (current page start)
    setPage(newPage);
    
    fetchAndDisplayJobs(prevCursor, activeFilters);
  }, [page, pageCursors, fetchAndDisplayJobs, activeFilters]);

  const handleFilterChange = useCallback((filters: { query: string; location: string; jobLevel: string; tags: string; sortOrder: string }) => {
    // Prevent resetting state if filters haven't actually changed (e.g. on initial mount)
    const hasChanged = 
      filters.query !== activeFilters.query ||
      filters.location !== activeFilters.location ||
      filters.jobLevel !== activeFilters.jobLevel ||
      filters.tags !== activeFilters.tags ||
      filters.sortOrder !== activeFilters.sortOrder;

    if (!hasChanged) return;

    setActiveFilters(filters);
    
    // Reset pagination on filter change
    setPage(1);
    setPageCursors([null]);

    const areFiltersActive = filters.query || filters.location || filters.jobLevel || filters.tags || filters.sortOrder !== 'desc';
    
    if (areFiltersActive) {
      fetchAndDisplayJobs(null, filters);
    } else {
      // Reset to initial static jobs if all filters are cleared
      setDisplayedJobs(staticJobs);
      setLastDocId(staticLastDocId);
      setHasMore(true);
    }
  }, [fetchAndDisplayJobs, staticJobs, staticLastDocId, activeFilters]);

  // Handle saving state to session storage on route change
  useSessionScrollRestoration({
    items: displayedJobs,
    lastDocId,
    hasMore,
    page,
    pageCursors,
    activeFilters,
    config: jobScrollConfig,
  });

  return (
    <Layout>
       <Head>
        <title>
          AI Job Spot | Your Hub for the Latest AI Job Opportunities
        </title>
        <meta
          name="description"
          content="Find the latest and most promising AI job opportunities, from machine learning engineers to data scientists. Your next career move in artificial intelligence starts here."
        />
        <meta
          name="keywords"
          content="AI jobs, artificial intelligence jobs, machine learning jobs, data scientist jobs, AI careers"
        />
        <meta name="robots" content="index, follow" />
        <meta
          property="og:title"
          content="AI Job Spot | Your Hub for the Latest AI Job Opportunities"
        />
        <meta
          property="og:description"
          content="Find the latest and most promising AI job opportunities, from machine learning engineers to data scientists. Your next career move in artificial intelligence starts here."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_SITE_URL} />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateJobListSchema(staticJobs)),
          }}
        />
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="page-title text-4xl sm:text-5xl md:text-6xl mb-4">
          AI Job Opportunities
        </h1>
        <JobSearchBar 
          initialFilters={initialFilters}
          onFilterChange={handleFilterChange} 
        />
        {displayedJobs.length === 0 && !loading ? (
          <p className="text-center text-neutral-600 font-serif text-lg">
            No job postings found. Please check back later or refine your search.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {displayedJobs.map((job, index) => (
              <React.Fragment key={job.id}>
                <JobCard job={job} />
                {(index + 1) % 3 === 0 &&
                  index !== displayedJobs.length - 1 && (
                    <div className="lg:col-span-3">
                      <AdContainer
                        slot={
                          process.env.NEXT_PUBLIC_ADSENSE_JOB_LISTING_SLOT || ''
                        }
                      />
                    </div>
                  )}
              </React.Fragment>
            ))}
          </div>
        )}
        
        {/* Pagination Controls */}
        <Pagination
          currentPage={page}
          hasPrevious={page > 1}
          hasNext={hasMore}
          onPrevious={handlePrevPage}
          onNext={handleNextPage}
          isLoading={loading}
        />
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  let lastDocId: string | null = null;
  try {
    const { jobs, lastVisible } = await getJobsServer(JOB_FETCH_LIMIT);

    const rawJobs = jobs.map((job) => ({
      ...job,
      postedDate: job.postedDate ? job.postedDate.toISOString() : null,
      expirationDate: job.expirationDate
        ? job.expirationDate.toISOString()
        : null,
    })) as SerializedJobPosting[];

    const now = new Date();
    const filteredJobs = rawJobs.filter((job) => {
      if (!job.postedDate) {
        return false;
      }
      const posted = new Date(job.postedDate);
      job.isNew = now.getTime() - posted.getTime() < NEW_JOB_THRESHOLD_MS;
      
      if (!job.expirationDate) {
        return true;
      }
      const expiration = new Date(job.expirationDate);
      return expiration.getTime() > now.getTime();
    });

    if (lastVisible) {
      lastDocId = lastVisible.id;
    }

    return {
      props: {
        initialJobs: filteredJobs,
        lastDocId,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Error fetching initial jobs:', error);
    return {
      props: {
        initialJobs: [],
        lastDocId: null,
      },
      revalidate: 60,
    };
  }
};


