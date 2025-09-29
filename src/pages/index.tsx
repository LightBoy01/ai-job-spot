import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import JobCard from '@/components/JobCard';
import AdContainer from '@/components/AdContainer';
import { getJobs } from '@/lib/firestoreClient';
import { SerializedJobPosting } from '@/lib/types';
import { NEW_JOB_THRESHOLD_MS, JOB_FETCH_LIMIT } from '@/lib/constants';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

interface HomeProps {
  initialJobs: SerializedJobPosting[];
  lastDocId: string | null;
}

export default function Home({
  initialJobs: staticJobs,
  lastDocId: staticLastDocId,
}: HomeProps) {
  const [displayedJobs, setDisplayedJobs] = useState<SerializedJobPosting[]>(staticJobs);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(true); // Assume true initially for server-side rendered content
  const [lastDocId, setLastDocId] = useState<string | null>(staticLastDocId);
  const isFetching = React.useRef(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobLevelFilter, setJobLevelFilter] = useState('');
  const [tagsFilter, setTagsFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchAndDisplayJobs = useCallback(async (
    startAfterId: string | null,
    append: boolean = false, // Whether to append to existing jobs or replace
    query: string,
    location?: string,
    jobLevel?: string,
    tags?: string
  ) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);

    const searchParams = new URLSearchParams({
      limit: String(JOB_FETCH_LIMIT),
    });
    if (startAfterId) searchParams.append('startAfter', startAfterId);
    if (query) searchParams.append('q', query);
    if (location) searchParams.append('location', location);
    if (jobLevel) searchParams.append('jobLevel', jobLevel);
    if (tags) searchParams.append('tags', tags);

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

  // Effect to trigger search when filters change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Only fetch if filters are active or if we're resetting to initial state
      if (searchQuery || locationFilter || jobLevelFilter || tagsFilter) {
        fetchAndDisplayJobs(null, false, searchQuery, locationFilter, jobLevelFilter, tagsFilter);
      } else {
        // Reset to initial static jobs if all filters are cleared
        setDisplayedJobs(staticJobs);
        setLastDocId(staticLastDocId);
        setHasMore(true); // Assume more if resetting to initial static jobs
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, locationFilter, jobLevelFilter, tagsFilter, fetchAndDisplayJobs, staticJobs, staticLastDocId]);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchAndDisplayJobs(lastDocId, true, searchQuery, locationFilter, jobLevelFilter, tagsFilter);
    }
  };

  // Handle saving state to session storage on route change
  useScrollRestoration({ jobs: displayedJobs, lastDocId, hasMore });

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
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="page-title text-4xl sm:text-5xl md:text-6xl mb-4">
          AI Job Opportunities
        </h1>
        <div className="mb-12 flex flex-col items-center">
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              placeholder="Search by title, company, location, or tags..."
              className="w-full p-4 pl-12 border border-black/5 bg-white rounded-lg shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] focus:ring-secondary focus:border-secondary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg
                className="h-5 w-5 text-neutral-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-4 text-sm text-primary-dark hover:text-primary font-semibold transition-colors"
          >
            {showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </button>

          {showFilters && (
            <div className="w-full max-w-lg mt-6 p-6 bg-neutral-50 rounded-lg shadow-inner border border-neutral-200 space-y-4">
              <div>
                <label htmlFor="locationFilter" className="block text-sm font-medium text-neutral-700 mb-1">Location</label>
                <input
                  type="text"
                  id="locationFilter"
                  placeholder="e.g., Remote, New York"
                  className="w-full p-3 border border-neutral-300 rounded-md focus:ring-secondary focus:border-secondary"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="jobLevelFilter" className="block text-sm font-medium text-neutral-700 mb-1">Job Level</label>
                <select
                  id="jobLevelFilter"
                  className="w-full p-3 border border-neutral-300 rounded-md focus:ring-secondary focus:border-secondary"
                  value={jobLevelFilter}
                  onChange={(e) => setJobLevelFilter(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="Entry-Level">Entry-Level</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid">Mid</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Principal">Principal</option>
                  <option value="Director">Director</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
              <div>
                <label htmlFor="tagsFilter" className="block text-sm font-medium text-neutral-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  id="tagsFilter"
                  placeholder="e.g., ML, GenAI, Remote"
                  className="w-full p-3 border border-neutral-300 rounded-md focus:ring-secondary focus:border-secondary"
                  value={tagsFilter}
                  onChange={(e) => setTagsFilter(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        {displayedJobs.length === 0 && !loading ? (
          <p className="text-center text-neutral-600">
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
        <div className="text-center mt-12">
            {loading ? (
                <p className="text-neutral-600">Loading more jobs...</p>
            ) : hasMore ? (
                <button
                onClick={loadMore}
                className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-primary-dark transition-colors duration-300"
                >
                Load More
                </button>
            ) : (
                <p className="text-neutral-600 font-serif text-lg pt-8 border-t border-neutral-200">
                You&apos;ve reached the end of the job listings.
                </p>
            )}
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
      postedDate: job.postedDate.toISOString(),
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
