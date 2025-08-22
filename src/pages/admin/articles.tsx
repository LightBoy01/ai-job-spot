import AdminLayout from '@/components/AdminLayout';
import { SerializedArticle } from '@/lib/types';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
import { getArticles } from '@/lib/firestoreClient';
import { useState } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { formatDate } from '@/lib/dateUtils';

interface AdminArticlesProps {
  initialArticles: SerializedArticle[];
}

const AdminArticles: React.FC<AdminArticlesProps> = ({ initialArticles }) => {
  const { idToken } = useAuth();
  const [articles, setArticles] = useState(initialArticles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [articleToDeleteId, setArticleToDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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
      setArticles(currentArticles => currentArticles.filter(article => article.id !== articleToDeleteId));
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
    setArticles(initialArticles);
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
    const { articles } = await getArticles(); // Destructure to get the articles array
    const serializedArticles = articles.map(article => {
      const { publishDate, imageUrl, ...rest } = article;
      return {
        ...rest,
        publishDate: (publishDate && 'toDate' in publishDate) ? (publishDate as { toDate: () => Date }).toDate().toISOString() : new Date(publishDate).toISOString(),
        imageUrl: imageUrl || null,
      };
    });
    return { props: { initialArticles: serializedArticles as unknown as SerializedArticle[] } };
  } catch (error) {
    console.error("Error fetching articles for admin panel:", error);
    return { props: { initialArticles: [] } };
  }
};

export default AdminArticles;
