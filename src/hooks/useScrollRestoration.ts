
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { SerializedJobPosting } from '@/lib/types';

const JOB_LIST_STORAGE_KEY = 'jobListingJobs';
const LAST_DOC_ID_STORAGE_KEY = 'jobListingLastDocId';
const HAS_MORE_STORAGE_KEY = 'jobListingHasMore';
const SCROLL_POS_STORAGE_KEY = 'jobListingScrollPos';

interface UseScrollRestorationProps {
  jobs: SerializedJobPosting[];
  lastDocId: string | null;
  hasMore: boolean;
}

/**
 * A custom hook to manage saving and restoring scroll position and job list
 * state to sessionStorage during route changes.
 * @param props - The state to be preserved.
 */
export function useScrollRestoration({
  jobs,
  lastDocId,
  hasMore,
}: UseScrollRestorationProps) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      // Do not save state if just navigating away from the site
      if (router.asPath === url) return;

      sessionStorage.setItem(JOB_LIST_STORAGE_KEY, JSON.stringify(jobs));
      sessionStorage.setItem(LAST_DOC_ID_STORAGE_KEY, lastDocId || '');
      sessionStorage.setItem(HAS_MORE_STORAGE_KEY, JSON.stringify(hasMore));
      sessionStorage.setItem(SCROLL_POS_STORAGE_KEY, window.scrollY.toString());
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);

    // Restore scroll position on initial load
    if (typeof window !== 'undefined') {
      const savedScrollPos = sessionStorage.getItem(SCROLL_POS_STORAGE_KEY);
      if (savedScrollPos) {
        window.scrollTo(0, parseInt(savedScrollPos, 10));
        sessionStorage.removeItem(SCROLL_POS_STORAGE_KEY);
      }
    }

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [jobs, lastDocId, hasMore, router]);

  // This hook doesn't return anything as it only produces side effects.
}

/**
 * Retrieves the initial state from sessionStorage on component mount.
 * This should be used in useState initializers to rehydrate state.
 */
export const getInitialStateFromSession = () => {
  if (typeof window === 'undefined') {
    return {
      initialJobs: null,
      initialLastDocId: null,
      initialHasMore: null,
    };
  }

  const savedJobs = sessionStorage.getItem(JOB_LIST_STORAGE_KEY);
  const savedLastDocId = sessionStorage.getItem(LAST_DOC_ID_STORAGE_KEY);
  const savedHasMore = sessionStorage.getItem(HAS_MORE_STORAGE_KEY);

  return {
    initialJobs: savedJobs ? JSON.parse(savedJobs) : null,
    initialLastDocId: savedLastDocId,
    initialHasMore: savedHasMore ? JSON.parse(savedHasMore) : null,
  };
};
