import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Configuration for session storage keys
export interface ScrollRestorationConfig {
  listKey: string;
  lastDocIdKey: string;
  hasMoreKey: string;
  scrollPosKey: string;
}

interface UseSessionScrollRestorationProps<T> {
  items: T[];
  lastDocId: string | null;
  hasMore: boolean;
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
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [items, lastDocId, hasMore, router, config]);

  // Effect for RESTORING scroll position on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedScrollPos = sessionStorage.getItem(config.scrollPosKey);
      if (savedScrollPos) {
        const targetScroll = parseInt(savedScrollPos, 10);
        let attempts = 0;
        const maxAttempts = 10; // Try for ~1 second (10 * 100ms)

        const attemptScroll = () => {
          // Check if the document is tall enough to scroll to the target
          const currentHeight = document.documentElement.scrollHeight;
          const viewportHeight = window.innerHeight;
          
          // If we can scroll to the target, or if we are at the bottom of the page
          if (currentHeight >= targetScroll + viewportHeight || attempts >= maxAttempts) {
            window.scrollTo(0, targetScroll);
            sessionStorage.removeItem(config.scrollPosKey);
          } else {
            attempts++;
            setTimeout(attemptScroll, 100); // Retry in 100ms
          }
        };

        // Start the attempt loop
        setTimeout(attemptScroll, 0);
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
    };
  }

  try {
    const savedItems = sessionStorage.getItem(config.listKey);
    const savedLastDocId = sessionStorage.getItem(config.lastDocIdKey);
    const savedHasMore = sessionStorage.getItem(config.hasMoreKey);

    return {
      initialItems: savedItems ? (JSON.parse(savedItems) as T[]) : null,
      initialLastDocId: savedLastDocId,
      initialHasMore: savedHasMore ? JSON.parse(savedHasMore) : null,
    };
  } catch (e) {
    console.warn('Failed to restore session state:', e);
    return {
      initialItems: null,
      initialLastDocId: null,
      initialHasMore: null,
    };
  }
};