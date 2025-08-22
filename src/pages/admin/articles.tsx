import AdminLayout from '@/components/AdminLayout';
import { SerializedArticle } from '@/lib/types';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { formatDate } from '@/lib/dateUtils';

interface AdminArticlesProps {
  initialArticles: SerializedArticle[];
  initialLastDocId: string | null;
}

const PAGE_SIZE = 10; // Define page size

const AdminArticles: React.FC<AdminArticlesProps> = ({ initialArticles, initialLastDocId }) => {
  const { idToken } = useAuth();
  const [articles, setArticles] = useState(initialArticles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [articleToDeleteId, setArticleToDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lastDocId, setLastDocId] = useState<string | null>(initialLastDocId);
  const [firstDocId, setFirstDocId] = useState<string | null>(null); // To track for previous page
  const [currentPage, setCurrentPage] = useState(1);
  const [pageHistory, setPageHistory] = useState<string[]>([]); // Stack to store firstDocId of each page

  useEffect(() => {
    // Reset pagination when search query changes or is cleared
    if (!searchQuery) {
      setArticles(initialArticles);
      setLastDocId(initialLastDocId);
      setFirstDocId(null);
      setCurrentPage(1);
      setPageHistory([]);
    }
  }, [searchQuery, initialArticles, initialLastDocId]);

  const fetchArticles = async (startAfterId: string | null = null, direction: 'next' | 'prev' | 'initial' = 'initial') => {
    if (!idToken) return;

    setIsSearching(true); // Use isSearching to disable buttons during fetch
    const toastId = toast.loading(direction === 'next' ? 'Loading next page...' : direction === 'prev' ? 'Loading previous page...' : 'Loading articles...');

    try {
      let url = `/api/articles/paginate?limit=${PAGE_SIZE}`;
      if (startAfterId && direction === 'next') {
        url += `&startAfter=${startAfterId}`;
      } else if (startAfterId && direction === 'prev') {
        // For previous, we need to fetch from the beginning up to the current firstDocId
        // This is a simplified approach; a more robust solution would involve storing more history
        // For now, we'll refetch initial if going back from page 2, or use history for deeper pages
        // This part needs careful consideration for true bidirectional pagination with Firestore
        // For simplicity, we'll just go back to the previous page's start ID
        url = `/api/articles/paginate?limit=${PAGE_SIZE}`;
        if (pageHistory.length > 1) {
          url += `&startAfter=${pageHistory[pageHistory.length - 2]}`;
        }
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch articles');
      }

      const data = await response.json();
      setArticles(data.articles);
      setLastDocId(data.lastDocId);

      if (data.articles.length > 0) {
        setFirstDocId(data.articles[0].id);
      } else {
        setFirstDocId(null);
      }

      if (direction === 'next') {
        setPageHistory(prev => [...prev, startAfterId || 'initial']);
        setCurrentPage(prev => prev + 1);
      } else if (direction === 'prev') {
        setPageHistory(prev => prev.slice(0, prev.length - 1));
        setCurrentPage(prev => prev - 1);
      } else if (direction === 'initial' && data.articles.length > 0) {
        setPageHistory([data.articles[0].id]);
      }

      toast.success('Articles loaded.', { id: toastId });
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred', { id: toastId });
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setArticleToDeleteId(id);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!articleToDeleteId) return;
    setIsModalOpen(false);
    const toastId = toast.loading('Deleting article...');

    try {
      const response = await fetch(`/api/articles/${articleToDeleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete article');
      }

      toast.success('Article deleted successfully', { id: toastId });
      // Re-fetch articles after deletion to update the list and pagination state
      fetchArticles(pageHistory[pageHistory.length - 1] || null, 'initial');
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred', { id: toastId });
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term.');
      return;
    }

    setIsSearching(true);
    const toastId = toast.loading('Searching...');

    try {
      const response = await fetch(`/api/articles/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search articles');
      }

      const searchResults = await response.json();
      setArticles(searchResults);
      setLastDocId(null); // Disable pagination after search
      setFirstDocId(null);
      setCurrentPage(1);
      setPageHistory([]);
      toast.success(`${searchResults.length} article(s) found.`, { id: toastId });
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred', { id: toastId });
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    // Re-fetch initial articles to reset pagination
    fetchArticles(null, 'initial');
  };

  return (
    <AdminLayout title="Manage Articles">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-serif font-bold text-primary-dark">Manage Articles</h1>
        <Link href="/admin/articles/new" passHref>
          <span className="inline-block bg-secondary text-white py-2 px-6 rounded-md font-semibold hover:bg-secondary-dark transition-colors cursor-pointer">
            + Add New Article
          </span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex items-center gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by article title..."
            className="w-full max-w-md p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition"
          />
          <button type="submit" disabled={isSearching} className="bg-primary text-white py-3 px-6 rounded-md font-semibold hover:bg-primary-dark transition-colors disabled:bg-neutral-400">
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          <button type="button" onClick={handleClearSearch} className="bg-neutral-200 text-neutral-800 py-3 px-5 rounded-md font-semibold hover:bg-neutral-300 transition-colors">
            Clear
          </button>
        </form>
      </div>

      <div className="bg-neutral-50 p-8 rounded-xl shadow-lg border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-neutral-300">
              <tr>
                <th className="py-3 px-4 text-sm font-semibold text-neutral-600 uppercase">Title</th>
                <th className="py-3 px-4 text-sm font-semibold text-neutral-600 uppercase">Author</th>
                <th className="py-3 px-4 text-sm font-semibold text-neutral-600 uppercase">Published</th>
                <th className="py-3 px-4 text-sm font-semibold text-neutral-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-neutral-100 transition-colors">
                  <td className="py-4 px-4 whitespace-nowrap font-medium text-neutral-800">{article.title}</td>
                  <td className="py-4 px-4 text-neutral-600">{article.author}</td>
                  <td className="py-4 px-4 text-neutral-600">{formatDate(article.publishDate)}</td>
                  <td className="py-4 px-4 text-right space-x-2">
                    <Link href={`/admin/articles/edit/${article.slug}`} passHref>
                      <span className="text-secondary-dark hover:text-secondary font-semibold cursor-pointer">Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(article.id!)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => fetchArticles(pageHistory[pageHistory.length - 2] || null, 'prev')}
            disabled={currentPage === 1 || isSearching}
            className="bg-neutral-200 text-neutral-800 py-2 px-4 rounded-md font-semibold hover:bg-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-neutral-600">Page {currentPage}</span>
          <button
            onClick={() => fetchArticles(lastDocId, 'next')}
            disabled={!lastDocId || isSearching}
            className="bg-primary text-white py-2 px-4 rounded-md font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this article? This action is permanent and cannot be undone."
      />
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<AdminArticlesProps> = async () => {
  try {
    const { articles, lastVisible } = await getArticles(PAGE_SIZE); // Fetch initial page
    const serializedArticles = articles.map(article => {
      const { publishDate, imageUrl, ...rest } = article;
      return {
        ...rest,
        publishDate: (publishDate && 'toDate' in publishDate) ? (publishDate as { toDate: () => Date }).toDate().toISOString() : new Date(publishDate).toISOString(),
        imageUrl: imageUrl || null,
      };
    });
    return { props: { initialArticles: serializedArticles as unknown as SerializedArticle[], initialLastDocId: lastVisible ? lastVisible.id : null } };
  } catch (error) {
    console.error("Error fetching articles for admin panel:", error);
    return { props: { initialArticles: [], initialLastDocId: null } };
  }
};

export default AdminArticles;
