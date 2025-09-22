import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import JobCard from '@/components/JobCard';
import AdContainer from '@/components/AdContainer';
import { getJobs } from '@/lib/firestoreClient'; // Keep for initial static fetch
import { SerializedJobPosting } from '@/lib/types';
import { NEW_JOB_THRESHOLD_MS, JOB_FETCH_LIMIT } from '@/lib/constants';
import { GetStaticProps } from 'next';
import Head from 'next/head';


interface HomeProps {
  initialJobs: SerializedJobPosting[];
  lastDocId: string | null;
}

export default function Home({ initialJobs, lastDocId: initialLastDocId }: HomeProps) {
  const router = useRouter();

  const [displayedJobs, setDisplayedJobs] = useState<SerializedJobPosting[]>(() => {
    if (typeof window !== 'undefined') {
      const savedJobs = sessionStorage.getItem('jobListingJobs');
      return savedJobs ? JSON.parse(savedJobs) : initialJobs;
    }
    return initialJobs;
  });
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedHasMore = sessionStorage.getItem('jobListingHasMore');
      return savedHasMore ? JSON.parse(savedHasMore) : true;
    }
    return true;
  });
  const [lastDocId, setLastDocId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const savedLastDocId = sessionStorage.getItem('jobListingLastDocId');
      return savedLastDocId || initialLastDocId;
    }
    return initialLastDocId;
  });
  const loader = useRef(null);
  const isFetching = useRef(false); // Lock to prevent multiple fetches
  const [searchQuery, setSearchQuery] = useState('');
  const isSearchActive = useCallback(() => searchQuery.trim() !== '', [searchQuery]);

  // Unified data fetching function
  const fetchJobs = useCallback(async (query: string, startAfterId: string | null) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);

    const isNewSearch = startAfterId === null;
    const searchParams = new URLSearchParams({
      q: query,
      startAfter: startAfterId || '',
      limit: String(JOB_FETCH_LIMIT)
    });

    try {
      const response = await fetch(`/api/jobs/search?${searchParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch jobs');
      }

      const { jobs: newFetchedJobs = [], lastVisible: newLastVisible } = await response.json();

      if (newFetchedJobs.length === 0) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      setDisplayedJobs(prevJobs => {
        const existingIds = new Set(prevJobs.map(j => j.id));
        const uniqueNewJobs = newFetchedJobs.filter((j: SerializedJobPosting) => !existingIds.has(j.id));
        const updatedJobs = isNewSearch ? newFetchedJobs : [...prevJobs, ...uniqueNewJobs];
        return updatedJobs;
      });
      setLastDocId(newLastVisible);

    } catch (error) {
      console.error('Error fetching jobs:', error);
      setHasMore(false); // Stop trying on error
    } finally {
      setLoading(false);
      isFetching.current = false; // Release the lock
    }
  }, []); // Removed dependencies to create a stable function

  // Effect for debouncing search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim() === '') {
        // If search is cleared, reset to initial static props
        setDisplayedJobs(initialJobs);
        setLastDocId(initialLastDocId);
        setHasMore(true);
      } else {
        // Otherwise, perform a new search
        fetchJobs(searchQuery, null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, initialJobs, initialLastDocId, fetchJobs]);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Infinite scroll handler
  const handleObserver = useCallback((entities: IntersectionObserverEntry[]) => {
    const target = entities[0];
    if (target.isIntersecting && hasMore && !isFetching.current) { // Check ref lock
      if (isSearchActive()) {
        fetchJobs(searchQuery, lastDocId);
      } else {
        // Paginate the general list (non-search)
        fetchJobs('', lastDocId);
      }
    }
  }, [hasMore, fetchJobs, searchQuery, lastDocId, isSearchActive]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 1.0,
    });

    const currentLoader = loader.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [handleObserver]);

  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      // Only save state if navigating away from the current page
      if (router.asPath === url) return;

      sessionStorage.setItem('jobListingJobs', JSON.stringify(displayedJobs));
      sessionStorage.setItem('jobListingLastDocId', lastDocId || '');
      sessionStorage.setItem('jobListingHasMore', JSON.stringify(hasMore));
      sessionStorage.setItem('jobListingScrollPos', window.scrollY.toString());
    };

    const handleRouteChangeComplete = (url: string) => {
      // Clear saved state if it's a full page reload (not a back navigation)
      // This is a heuristic: if the URL is the same but it's a new navigation, clear.
      // More robust solutions might involve checking router.beforePopState
      if (router.asPath === url && !router.isReady) { // router.isReady is false on initial load
        sessionStorage.removeItem('jobListingJobs');
        sessionStorage.removeItem('jobListingLastDocId');
        sessionStorage.removeItem('jobListingHasMore');
        sessionStorage.removeItem('jobListingScrollPos');
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    // Restore scroll position on mount if available
    if (typeof window !== 'undefined') {
      const savedScrollPos = sessionStorage.getItem('jobListingScrollPos');
      if (savedScrollPos) {
        window.scrollTo(0, parseInt(savedScrollPos, 10));
        sessionStorage.removeItem('jobListingScrollPos'); // Clear after restoring
      }
    }

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [displayedJobs, lastDocId, hasMore, router]);

  return (
    <Layout>
      <Head>
        <title>AI Job Spot | Your Hub for the Latest AI Job Opportunities</title>
        <meta
          name="description"
          content="Find the latest and most promising AI job opportunities, from machine learning engineers to data scientists. Your next career move in artificial intelligence starts here."
        />
        <meta name="keywords" content="AI jobs, artificial intelligence jobs, machine learning jobs, data scientist jobs, AI careers" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="AI Job Spot | Your Hub for the Latest AI Job Opportunities" />
        <meta property="og:description" content="Find the latest and most promising AI job opportunities, from machine learning engineers to data scientists. Your next career move in artificial intelligence starts here." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_SITE_URL} />
         
      </Head>
      
      <div className="max-w-6xl mx-auto px-4 py-12">
            <h1 className="page-title text-4xl sm:text-5xl md:text-6xl mb-4">AI Job Opportunities</h1>
        <div className="mb-12 flex justify-center">
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              placeholder="Search by title, company, location, or tags..."
              className="w-full p-4 pl-12 border border-black/5 bg-white rounded-lg shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] focus:ring-secondary focus:border-secondary"
              onChange={handleSearchChange}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <svg className="h-5 w-5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
          </div>
        </div>
        {displayedJobs.length === 0 && !loading ? (
          <p className="text-center text-neutral-600">No job postings available at the moment. Please check back later!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {displayedJobs.map((job, index) => (
              <React.Fragment key={job.id}>
                <JobCard job={job} />
                {(index + 1) % 3 === 0 && index !== displayedJobs.length - 1 && (
                  <div className="lg:col-span-3">
                    <AdContainer slot={process.env.NEXT_PUBLIC_ADSENSE_JOB_LISTING_SLOT || ''} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {loading && (
          <p className="text-center text-neutral-600 mt-8">Loading more jobs...</p>
        )}
        {!hasMore && !loading && displayedJobs.length > 0 && (
          <p className="text-center text-neutral-600 font-serif text-lg mt-8 pt-8 border-t border-neutral-200">You&apos;ve reached the end of the job listings.</p>
        )}
        <div ref={loader} className="h-1"></div> {/* Invisible element to observe */}
      </div>
      
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  let lastDocId: string | null = null;
  try {
    const { jobs, lastVisible } = await getJobs(JOB_FETCH_LIMIT);

    const rawJobs = jobs.map(job => ({
      ...job,
      postedDate: job.postedDate.toISOString(), // Convert Date to ISO string
      expirationDate: job.expirationDate ? job.expirationDate.toISOString() : null, // Convert Date to ISO string, handle optional
    })) as SerializedJobPosting[];

    // Adjust isNew flag based on postedDate and filter out expired jobs
    const now = new Date();
    const filteredJobs = rawJobs.filter(job => {
      // If postedDate is null, this job is invalid and should be filtered out.
      if (!job.postedDate) {
        return false;
      }
      const posted = new Date(job.postedDate);
      if ((now.getTime() - posted.getTime()) > NEW_JOB_THRESHOLD_MS) {
        job.isNew = false;
      } else {
        job.isNew = true;
      }
      // If expirationDate is not set or is null, assume it's still active
      if (!job.expirationDate) {
        return true;
      }
      // Filter out jobs where expirationDate is in the past
      const expiration = new Date(job.expirationDate); // Convert string to Date
      return expiration.getTime() > now.getTime();
    });

    if (lastVisible) {
      lastDocId = lastVisible.id;
    }

    return {
      props: {
        initialJobs: filteredJobs.map(job => ({
          ...job,
          postedDate: job.postedDate,
          expirationDate: job.expirationDate,
        })),
        lastDocId,
      },
      revalidate: 60, // Revalidate the home page every 60 seconds
    };
  } catch (error) {
    console.error("Error fetching initial jobs:", error);
    return {
      props: {
        initialJobs: [],
        lastDocId: null,
      },
      revalidate: 60,
    };
  }
};