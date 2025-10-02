import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArticlesPage from '../../src/pages/articles';
import { useRouter } from 'next/router';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    query: {},
    push: jest.fn(),
    pathname: '/articles',
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
  })),
}));

// Mock Firebase client module
jest.mock('../../src/lib/firebase', () => ({
  app: { name: '[DEFAULT]' },
  db: {},
  auth: {},
}));

// Mock useAuth hook
jest.mock('../../src/hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({
    user: { uid: 'test-uid', email: 'test@example.com' },
    loading: false,
  }),
}));

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ articles: [], lastVisible: null }),
  })
) as jest.Mock;

const mockUseRouter = useRouter as jest.Mock;

describe('ArticlesPage', () => {
  const mockPush = jest.fn();
  const mockInitialArticles = [
    {
      id: '1',
      title: 'Editorial Article',
      slug: 'editorial-article',
      contentType: 'editorial',
      author: 'Test Author',
      publishDate: '2025-01-01T00:00:00.000Z',
      excerpt: 'Excerpt 1',
      tags: ['tag1'],
      issueNo: 1,
      volumeNo: 1,
    },
    {
      id: '2',
      title: 'Briefing Article',
      slug: 'briefing-article',
      contentType: 'briefing',
      author: 'External Source',
      publishDate: '2025-01-02T00:00:00.000Z',
      excerpt: 'Excerpt 2',
      tags: ['tag2'],
      issueNo: 1,
      volumeNo: 1,
      sourceName: 'TechCrunch',
      originalUrl: 'https://techcrunch.com/briefing',
    },
  ];

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      query: {},
      push: mockPush,
      pathname: '/articles',
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
    });
    mockPush.mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders without crashing', () => {
    render(<ArticlesPage initialArticles={mockInitialArticles} lastDocId={null} />);
    expect(screen.getByText('Insights & Musings')).toBeInTheDocument();
  });

  it('displays filter buttons', () => {
    render(<ArticlesPage initialArticles={mockInitialArticles} lastDocId={null} />);
    expect(screen.getByText('All Content')).toBeInTheDocument();
    expect(screen.getByText('Editorials')).toBeInTheDocument();
    expect(screen.getByText('Curated Briefings')).toBeInTheDocument();
  });

  it('filters articles by "editorial" when "Editorials" button is clicked', async () => {
    render(<ArticlesPage initialArticles={mockInitialArticles} lastDocId={null} />);
    fireEvent.click(screen.getByText('Editorials'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        { pathname: '/articles', query: { filter: 'editorial' } },
        undefined,
        { shallow: true }
      );
    });
    // Verify fetchArticles is called with the correct filter
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('filter=editorial')
      );
    });
  });

  it('filters articles by "briefing" when "Curated Briefings" button is clicked', async () => {
    render(<ArticlesPage initialArticles={mockInitialArticles} lastDocId={null} />);
    fireEvent.click(screen.getByText('Curated Briefings'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        { pathname: '/articles', query: { filter: 'briefing' } },
        undefined,
        { shallow: true }
      );
    });
    // Verify fetchArticles is called with the correct filter
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('filter=briefing')
      );
    });
  });

  it('initializes filter from URL query parameter', async () => {
    mockUseRouter.mockReturnValue({
      query: { filter: 'briefing' },
      push: mockPush,
      pathname: '/articles',
    });

    render(<ArticlesPage initialArticles={mockInitialArticles} lastDocId={null} />);

    // The useEffect should set the filter based on query
    await waitFor(() => {
      expect(screen.getByText('Curated Briefings')).toHaveClass('bg-primary');
    });
    // Also verify fetchArticles is called with the correct filter on initial load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('filter=briefing')
      );
    });
  });
});
