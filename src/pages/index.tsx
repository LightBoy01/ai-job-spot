import React, { useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import JobCard from '@/components/JobCard';
import AdContainer from '@/components/AdContainer';
import { getJobs } from '@/lib/firestoreClient';
import { SerializedJobPosting } from '@/lib/types';
import { NEW_JOB_THRESHOLD_MS, JOB_FETCH_LIMIT } from '@/lib/constants';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useSessionScrollRestoration, getInitialStateFromSession, ScrollRestorationConfig } from '@/hooks/useSessionScrollRestoration';
import JobSearchBar from '@/components/JobSearchBar';

const jobScrollConfig: ScrollRestorationConfig = {
  listKey: 'jobListingJobs',
  lastDocIdKey: 'jobListingLastDocId',
  hasMoreKey: 'jobListingHasMore',
  scrollPosKey: 'jobListingScrollPos',
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
  const isFetching = React.useRef(false);
  const [activeFilters, setActiveFilters] = useState({ query: '', location: '', jobLevel: '', tags: '', sortOrder: 'desc' });

  const fetchAndDisplayJobs = useCallback(async (
    startAfterId: string | null,
    append: boolean = false, // Whether to append to existing jobs or replace
    filters: { query: string; location: string; jobLevel: string; tags: string; sortOrder: string }
  ) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);

    const searchParams = new URLSearchParams({
      limit: String(JOB_FETCH_LIMIT),
    });
    if (startAfterId) searchParams.append('startAfter', startAfterId);
    if (filters.query) searchParams.append('q', filters.query);
    if (filters.location) searchParams.append('location', filters.location);
    if (filters.jobLevel) searchParams.append('jobLevel', filters.jobLevel);
    if (filters.tags) searchParams.append('tags', filters.tags);
    if (filters.sortOrder) searchParams.append('sortOrder', filters.sortOrder);

    try {
      const response = await fetch(`/api/jobs/search?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');

      const { jobs: newFetchedJobs = [], lastVisible: newLastVisible } = await response.json();

      setDisplayedJobs((prevJobs) => {
        if (append) {
          const existingIds = new Set(prevJobs.map((j) => j.id));
          const uniqueNewJobs = newFetchedJobs.filter((j: SerializedJobPosting) => !existingIds.has(j.id));
          return [...prevJobs, ...uniqueNewJobs];
        } else {
          return newFetchedJobs;
        }
      });
      setLastDocId(newLastVisible);
      setHasMore(newFetchedJobs.length === JOB_FETCH_LIMIT); // If we got less than limit, no more pages
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setHasMore(false);
      if (!append) setDisplayedJobs([]); // Clear jobs on error if not appending
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  const handleFilterChange = useCallback((filters: { query: string; location: string; jobLevel: string; tags: string; sortOrder: string }) => {
    setActiveFilters(filters);
    const areFiltersActive = filters.query || filters.location || filters.jobLevel || filters.tags || filters.sortOrder !== 'desc';
    if (areFiltersActive) {
      fetchAndDisplayJobs(null, false, filters);
    } else {
      // Reset to initial static jobs if all filters are cleared
      setDisplayedJobs(staticJobs);
      setLastDocId(staticLastDocId);
      setHasMore(true); // Assume more if resetting to initial static jobs
    }
  }, [fetchAndDisplayJobs, staticJobs, staticLastDocId]);

  const loader = React.useRef(null);

  const handleObserver = React.useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading) {
      fetchAndDisplayJobs(lastDocId, true, activeFilters);
    }
  }, [hasMore, loading, lastDocId, activeFilters, fetchAndDisplayJobs]);

  React.useEffect(() => {
    const option = {
      root: null,
      rootMargin: "20px",
      threshold: 0
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loader.current) observer.observe(loader.current);
  }, [handleObserver]);

  // Handle saving state to session storage on route change
  useSessionScrollRestoration({
    items: displayedJobs,
    lastDocId,
    hasMore,
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
        <JobSearchBar onFilterChange={handleFilterChange} />
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
        <div className="text-center mt-12 h-10">
            {loading && <p className="text-neutral-500 font-sans">Loading more jobs...</p>}
            {!hasMore && displayedJobs.length > 0 && (
                <p className="text-neutral-600 font-serif text-lg pt-8 border-t border-neutral-200">
                You&apos;ve reached the end of the job listings.
                </p>
            )}
            <div ref={loader} />
        </div>
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  let lastDocId: string | null = null;
  try {
    const { jobs, lastVisible } = await getJobs(JOB_FETCH_LIMIT);

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


