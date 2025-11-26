
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
    // We only want this to run once on mount
    if (typeof window !== 'undefined') {
      const savedScrollPos = sessionStorage.getItem(config.scrollPosKey);
      if (savedScrollPos) {
        // Use a small timeout to allow the browser to render the rehydrated content
        const timer = setTimeout(() => {
          window.scrollTo(0, parseInt(savedScrollPos, 10));
          // Once we've attempted to scroll, remove the key
          sessionStorage.removeItem(config.scrollPosKey);
        }, 100);

        return () => clearTimeout(timer);
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

  const savedItems = sessionStorage.getItem(config.listKey);
  const savedLastDocId = sessionStorage.getItem(config.lastDocIdKey);
  const savedHasMore = sessionStorage.getItem(config.hasMoreKey);

  return {
    initialItems: savedItems ? (JSON.parse(savedItems) as T[]) : null,
    initialLastDocId: savedLastDocId,
    initialHasMore: savedHasMore ? JSON.parse(savedHasMore) : null,
  };
};
