import AdminLayout from '@/components/AdminLayout';
import { SerializedArticle } from '@/lib/types';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
import { useState, useCallback } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { formatDate } from '@/lib/dateUtils';
import { parse } from 'cookie';

interface AdminArticlesProps {
  initialArticles: SerializedArticle[];
  initialLastDocId: string | null;
}

const PAGE_SIZE = 10;

const AdminArticles: React.FC<AdminArticlesProps> = ({ initialArticles, initialLastDocId }) => {
  const { idToken, loading: authLoading } = useAuth();
  const [articles, setArticles] = useState(initialArticles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [articleToDeleteId, setArticleToDeleteId] = useState<string | null>(null);
  const [articleToDeleteTitle, setArticleToDeleteTitle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastDocId, setLastDocId] = useState<string | null>(initialLastDocId);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAdminArticles = useCallback(async (query: string, startAfter: string | null) => {
    if (!idToken || isLoading) return;

    setIsLoading(true);
    const toastId = toast.loading('Loading articles...');

    try {
      const params = new URLSearchParams({
        q: query,
        limit: String(PAGE_SIZE),
      });
      if (startAfter) {
        params.append('startAfter', startAfter);
      }

      const response = await fetch(`/api/admin/articles/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch articles');
      }

      const data = await response.json();
      setArticles(prevArticles => startAfter ? [...prevArticles, ...data.articles] : data.articles);
      setLastDocId(data.lastDocId);
      toast.success('Articles loaded successfully!', { id: toastId });

    } catch (error) {
      console.error('Error fetching admin articles:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  }, [idToken, isLoading]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminArticles(searchQuery, null);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchAdminArticles('', null);
  };

  const handleDeleteClick = (id: string, title: string) => {
    setArticleToDeleteId(id);
    setArticleToDeleteTitle(title);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!articleToDeleteId || !idToken) return;
    setIsModalOpen(false);
    const toastId = toast.loading(`Deleting article "${articleToDeleteTitle || ''}"...`);

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

      toast.success(`Article "${articleToDeleteTitle || ''}" deleted successfully!`, { id: toastId });
      fetchAdminArticles(searchQuery, null); // Refetch current view
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred', { id: toastId });
    }
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

      <div className="mb-6">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by article title..."
            className="w-full max-w-md p-3 rounded-md border border-neutral-300 outline-none transition"
          />
          <button type="submit" disabled={isLoading || authLoading} className="bg-primary text-white py-3 px-6 rounded-md font-semibold hover:bg-primary-dark transition-colors disabled:bg-neutral-400">
            {isLoading ? 'Searching...' : 'Search'}
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
                      <span className={`text-secondary-dark hover:text-secondary font-semibold ${authLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(article.id!, article.title)}
                      disabled={authLoading}
                      className="text-red-600 hover:text-red-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center items-center mt-6">
          <button
            onClick={() => fetchAdminArticles(searchQuery, lastDocId)}
            disabled={!lastDocId || isLoading || authLoading}
            className="bg-primary text-white py-2 px-4 rounded-md font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Load More
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

export const getServerSideProps: GetServerSideProps<AdminArticlesProps> = async (context) => {
  try {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = context.req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    const cookies = parse(context.req.headers.cookie || '');
    const idToken = cookies.__session;

    if (!idToken) {
      return { redirect: { destination: '/auth/login', permanent: false } };
    }

    const params = new URLSearchParams({ q: '', limit: String(PAGE_SIZE) });
    const response = await fetch(`${baseUrl}/api/admin/articles/search?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${idToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch initial articles: ${response.statusText}`);
    }

    const data = await response.json();
    return { props: { initialArticles: data.articles, initialLastDocId: data.lastDocId } };

  } catch (error) {
    console.error("[getServerSideProps] Error fetching articles for admin panel:", error);
    return { props: { initialArticles: [], initialLastDocId: null } };
  }
};

export default AdminArticles;