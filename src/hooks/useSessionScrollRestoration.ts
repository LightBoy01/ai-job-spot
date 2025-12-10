import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Configuration for session storage keys
export interface ScrollRestorationConfig {
  listKey: string;
  lastDocIdKey: string;
  hasMoreKey: string;
  scrollPosKey: string;
  // New keys for pagination and filters
  pageKey: string;
  pageCursorsKey: string;
  filtersKey: string;
}

interface UseSessionScrollRestorationProps<T> {
  items: T[];
  lastDocId: string | null;
  hasMore: boolean;
  // New props
  page: number;
  pageCursors: (string | null)[];
  activeFilters: any;
  config: ScrollRestorationConfig;
}

/**
 * A generic custom hook to manage saving and restoring scroll position and list
 * state to sessionStorage during route changes.
 * @param props - The state to be preserved and the key configuration.
 */
export function useSessionScrollRestoration<T>({
  items,
  lastDocId,
  hasMore,
  page,
  pageCursors,
  activeFilters,
  config,
}: UseSessionScrollRestorationProps<T>) {
  const router = useRouter();

  // Effect for SAVING state on route change
  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      // Do not save state if just the query string is changing on the same page
      if (router.pathname === url.split('?')[0]) return;

      sessionStorage.setItem(config.listKey, JSON.stringify(items));
      sessionStorage.setItem(config.lastDocIdKey, lastDocId || '');
      sessionStorage.setItem(config.hasMoreKey, JSON.stringify(hasMore));
      sessionStorage.setItem(config.scrollPosKey, window.scrollY.toString());
      
      // Save new state
      sessionStorage.setItem(config.pageKey, page.toString());
      sessionStorage.setItem(config.pageCursorsKey, JSON.stringify(pageCursors));
      sessionStorage.setItem(config.filtersKey, JSON.stringify(activeFilters));
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [items, lastDocId, hasMore, page, pageCursors, activeFilters, router, config]);

  // Effect for RESTORING scroll position on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedScrollPos = sessionStorage.getItem(config.scrollPosKey);
      
      // Only attempt to scroll if there was a saved position and it's more than a screen down
      if (savedScrollPos && parseInt(savedScrollPos, 10) > window.innerHeight) {
        const targetScroll = parseInt(savedScrollPos, 10);
        let attempts = 0;
        const maxAttempts = 30; // Increased patience: try for ~3 seconds

        const attemptScroll = () => {
          attempts++;
          // Check if the document is tall enough to scroll to the target.
          // Or give up if we've tried too many times.
          if (document.documentElement.scrollHeight >= targetScroll || attempts >= maxAttempts) {
            window.scrollTo({ top: targetScroll, behavior: 'auto' });
            
            // Once we've successfully scrolled (or given up), clear all keys for this config
            sessionStorage.removeItem(config.scrollPosKey);
            sessionStorage.removeItem(config.listKey);
            sessionStorage.removeItem(config.lastDocIdKey);
            sessionStorage.removeItem(config.hasMoreKey);
            sessionStorage.removeItem(config.pageKey);
            sessionStorage.removeItem(config.pageCursorsKey);
            sessionStorage.removeItem(config.filtersKey);
          } else {
            // If not tall enough, wait and try again.
            setTimeout(attemptScroll, 100);
          }
        };

        // Start the first attempt after a short delay to allow initial render.
        setTimeout(attemptScroll, 100);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Retrieves the initial state from sessionStorage on component mount.
 * This should be used in useState initializers to rehydrate state.
 * @param config - The key configuration.
 */
export const getInitialStateFromSession = <T>(config: ScrollRestorationConfig) => {
  if (typeof window === 'undefined') {
    return {
      initialItems: null,
      initialLastDocId: null,
      initialHasMore: null,
      initialPage: 1,
      initialPageCursors: [null],
      initialFilters: null,
    };
  }

  try {
    const savedItems = sessionStorage.getItem(config.listKey);
    const savedLastDocId = sessionStorage.getItem(config.lastDocIdKey);
    const savedHasMore = sessionStorage.getItem(config.hasMoreKey);
    const savedPage = sessionStorage.getItem(config.pageKey);
    const savedPageCursors = sessionStorage.getItem(config.pageCursorsKey);
    const savedFilters = sessionStorage.getItem(config.filtersKey);

    return {
      initialItems: savedItems ? (JSON.parse(savedItems) as T[]) : null,
      initialLastDocId: savedLastDocId,
      initialHasMore: savedHasMore ? JSON.parse(savedHasMore) : null,
      initialPage: savedPage ? parseInt(savedPage, 10) : 1,
      initialPageCursors: savedPageCursors ? JSON.parse(savedPageCursors) : [null],
      initialFilters: savedFilters ? JSON.parse(savedFilters) : null,
    };
  } catch (e) {
    console.warn('Failed to restore session state:', e);
    return {
      initialItems: null,
      initialLastDocId: null,
      initialHasMore: null,
      initialPage: 1,
      initialPageCursors: [null],
      initialFilters: null,
    };
  }
};