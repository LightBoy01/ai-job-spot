import { renderHook } from '@testing-library/react';
import {
  useScrollRestoration,
  getInitialStateFromSession,
} from '@/hooks/useScrollRestoration';
import { useRouter } from 'next/router';
import { SerializedJobPosting } from '@/lib/types';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Define a valid mock job posting
const mockJob: SerializedJobPosting = {
  id: 'job-1',
  title: 'Test Job',
  company: 'Test Co',
  location: 'Remote',
  postedDate: new Date().toISOString(),
  applicationLink: 'https://example.com',
  tags: ['test'],
  description: 'desc',
  excerpt: 'exc',
  status: 'published',
  expirationDate: null,
};

describe('useScrollRestoration', () => {
  const mockRouter = {
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockSessionStorage.clear();
    (window.scrollTo as jest.Mock).mockClear();
    mockRouter.events.on.mockClear();
    mockRouter.events.off.mockClear();
  });

  describe('getInitialStateFromSession', () => {
    it('should return nulls if sessionStorage is empty', () => {
      const { initialJobs, initialLastDocId, initialHasMore } = getInitialStateFromSession();
      expect(initialJobs).toBeNull();
      expect(initialLastDocId).toBeNull();
      expect(initialHasMore).toBeNull();
    });

    it('should return parsed data from sessionStorage', () => {
      mockSessionStorage.setItem('jobListingJobs', JSON.stringify([mockJob]));
      mockSessionStorage.setItem('jobListingLastDocId', 'doc1');
      mockSessionStorage.setItem('jobListingHasMore', 'false');

      const { initialJobs, initialLastDocId, initialHasMore } = getInitialStateFromSession();

      expect(initialJobs).toEqual([mockJob]);
      expect(initialLastDocId).toBe('doc1');
      expect(initialHasMore).toBe(false);
    });
  });

  describe('useScrollRestoration side effects', () => {
    it('should restore scroll position on mount if it exists in sessionStorage', () => {
      mockSessionStorage.setItem('jobListingScrollPos', '500');
      renderHook(() => useScrollRestoration({ jobs: [], lastDocId: null, hasMore: true }));
      expect(window.scrollTo).toHaveBeenCalledWith(0, 500);
      // It should remove the item after restoring
      expect(mockSessionStorage.getItem('jobListingScrollPos')).toBeNull();
    });

    it('should not scroll if no position is saved', () => {
      renderHook(() => useScrollRestoration({ jobs: [], lastDocId: null, hasMore: true }));
      expect(window.scrollTo).not.toHaveBeenCalled();
    });

    it('should attach and detach routeChangeStart event listener', () => {
      const { unmount } = renderHook(() => useScrollRestoration({ jobs: [], lastDocId: null, hasMore: true }));
      expect(mockRouter.events.on).toHaveBeenCalledWith('routeChangeStart', expect.any(Function));
      unmount();
      expect(mockRouter.events.off).toHaveBeenCalledWith('routeChangeStart', expect.any(Function));
    });

    it('should save state to sessionStorage on routeChangeStart', () => {
      const testProps = {
        jobs: [mockJob],
        lastDocId: 'doc-abc',
        hasMore: false,
      };

      const { rerender } = renderHook(
        (props: UseScrollRestorationProps) => useScrollRestoration(props),
        {
          initialProps: { jobs: [], lastDocId: null, hasMore: true },
        }
      );

      rerender(testProps);

      // Manually trigger the event handler that was passed to router.events.on
      // We need to grab the LATEST handler attached, hence mock.calls.length - 1
      const routeChangeHandler = mockRouter.events.on.mock.calls[mockRouter.events.on.mock.calls.length - 1][1];
      routeChangeHandler('/some-other-url');

      expect(JSON.parse(mockSessionStorage.getItem('jobListingJobs')!)).toEqual(
        testProps.jobs
      );
      expect(mockSessionStorage.getItem('jobListingLastDocId')).toBe(
        testProps.lastDocId
      );
      expect(JSON.parse(mockSessionStorage.getItem('jobListingHasMore')!)).toBe(
        testProps.hasMore
      );
    });
  });
});
