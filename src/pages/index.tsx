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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

  const fetchMoreJobs = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      let startAfterSnapshot = undefined;
      if (lastDocId) {
        const docRef = doc(db, 'jobs', lastDocId);
        startAfterSnapshot = await getDoc(docRef);
        if (!startAfterSnapshot.exists()) {
          console.warn(`Last document with ID ${lastDocId} does not exist. Stopping pagination.`);
          setHasMore(false);
          setLoading(false);
          return;
        }
      }

      const { jobs: newFetchedJobs, lastVisible: newLastVisible } = await getJobs(JOB_FETCH_LIMIT, startAfterSnapshot);

      if (newFetchedJobs.length === 0) {
        setHasMore(false);
      } else {
        setDisplayedJobs(prevJobs => {
          const now = new Date();
          const processedNewJobs = newFetchedJobs.map(job => {
            const posted = new Date(job.postedDate);
            if ((now.getTime() - posted.getTime()) > NEW_JOB_THRESHOLD_MS) {
              job.isNew = false;
            }
            return job;
          }).filter(job => {
            if (!job.expirationDate) return true;
            const expiration = new Date(job.expirationDate);
            return expiration.getTime() > now.getTime();
          });

          // Filter out any duplicates that might occur if a job was added/updated during revalidation
          const uniqueNewJobs = processedNewJobs.map(job => ({
            ...job,
            postedDate: job.postedDate.toISOString(), // Convert Date to ISO string
            expirationDate: job.expirationDate ? job.expirationDate.toISOString() : null, // Convert Date to ISO string, handle optional
          })).filter((newJob: SerializedJobPosting) =>
            !prevJobs.some(existingJob => existingJob.id === newJob.id)
          );
          return [...prevJobs, ...uniqueNewJobs];
        });
        setLastDocId(newLastVisible ? newLastVisible.id : null);
      }
    } catch (error) {
      console.error('Error fetching more jobs:', error);
      setHasMore(false); // Stop trying to load more on error
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, lastDocId]);

  useEffect(() => {
    const handleObserver = (entities: IntersectionObserverEntry[]) => {
      const target = entities[0];
      if (target.isIntersecting && hasMore && !loading) {
        fetchMoreJobs();
      }
    };

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
  }, [hasMore, loading, fetchMoreJobs]); // fetchMoreJobs is now a stable dependency

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
        <h1 className="lg:text-5xl md:text-4xl text-3xl font-serif font-bold text-primary-dark mb-12 text-center leading-tight !text-center">Latest AI Job Opportunities</h1>
        {displayedJobs.length === 0 && !loading ? (
          <p className="text-center text-neutral-600">No job postings available at the moment. Please check back later!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      const posted = new Date(job.postedDate);
      if ((now.getTime() - posted.getTime()) > NEW_JOB_THRESHOLD_MS) {
        job.isNew = false;
      }
      // If expirationDate is not set, assume it's still active
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