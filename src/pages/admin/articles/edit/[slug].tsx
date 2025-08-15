
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
import AdminLayout from '@/components/AdminLayout';
import { getArticleBySlug } from '@/lib/firestoreClient';
import { SerializedArticle, Article } from '@/lib/types';

type ArticleFormData = Partial<Omit<Article, 'id' | 'publishDate' | 'tags'> & {
  tags: string;
  publishDate: string;
}>;

interface EditArticleProps {
  article: SerializedArticle | null;
}

const EditArticlePage: React.FC<EditArticleProps> = ({ article }) => {
  const router = useRouter();
  const { idToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ArticleFormData>({});

  useEffect(() => {
    if (article) {
      setFormData({
        ...article,
        tags: article.tags?.join(', ') || '',
        publishDate: article.publishDate ? new Date(article.publishDate).toISOString().split('T')[0] : '',
      });
    }
  }, [article]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    setFormData(prev => ({ ...prev, [name]: isNumber ? (value === '' ? undefined : Number(value)) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Updating article...');

    try {
      const response = await fetch(`/api/articles/${article.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify(formData),
        });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update article');
      }

      toast.success('Article updated successfully!', { id: toastId });
      router.push('/admin/articles');
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err instanceof Error ? err.message : 'An unknown error occurred', { id: toastId });
      setIsSubmitting(false);
    }
  };

  if (!article) {
    return (
      <AdminLayout title="Error">
        <h1 className="text-4xl font-serif font-bold text-red-600">Article Not Found</h1>
        <p className="text-neutral-600 mt-4">The article you are trying to edit does not exist. It may have been deleted.</p>
        <Link href="/admin/articles" passHref>
          <span className="mt-6 inline-block text-secondary-dark hover:text-secondary font-semibold cursor-pointer">
            &larr; Back to Articles
          </span>
        </Link>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Edit Article: ${article.title}`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-serif font-bold text-primary-dark">Edit Article</h1>
        <Link href="/admin/articles" passHref>
          <span className="text-neutral-600 hover:text-primary-dark font-semibold cursor-pointer">
            &larr; Back to Articles
          </span>
        </Link>
      </div>

      <div className="bg-neutral-50 p-8 rounded-xl shadow-lg border border-neutral-200">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-neutral-700 mb-2">Article Title</label>
              <input type="text" id="title" name="title" value={formData.title || ''} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition" required />
            </div>
            <div>
              <label htmlFor="author" className="block text-sm font-semibold text-neutral-700 mb-2">Author</label>
              <input type="text" id="author" name="author" value={formData.author || ''} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition" required />
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-semibold text-neutral-700 mb-2">URL Slug</label>
              <input type="text" id="slug" name="slug" value={formData.slug || ''} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition" required />
            </div>
            <div>
              <label htmlFor="publishDate" className="block text-sm font-semibold text-neutral-700 mb-2">Publish Date</label>
              <input type="date" id="publishDate" name="publishDate" value={formData.publishDate || ''} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition" required />
            </div>
          </div>

          <div>
            <label htmlFor="contentBody" className="block text-sm font-semibold text-neutral-700 mb-2">Article Content (HTML supported)</label>
            <textarea id="contentBody" name="contentBody" value={formData.contentBody || ''} onChange={handleChange} rows={15} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition font-mono text-sm" required></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="tags" className="block text-sm font-semibold text-neutral-700 mb-2">Tags (comma-separated)</label>
              <input type="text" id="tags" name="tags" value={formData.tags || ''} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition" />
            </div>
            <div>
              <label htmlFor="volumeNo" className="block text-sm font-semibold text-neutral-700 mb-2">Volume No.</label>
              <input type="number" id="volumeNo" name="volumeNo" value={formData.volumeNo || ''} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition" />
            </div>
            <div>
              <label htmlFor="issueNo" className="block text-sm font-semibold text-neutral-700 mb-2">Issue No.</label>
              <input type="number" id="issueNo" name="issueNo" value={formData.issueNo || ''} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition" />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-10">
            <Link href="/admin/articles" passHref>
              <span className="bg-neutral-200 text-neutral-800 py-2 px-6 rounded-md font-semibold hover:bg-neutral-300 transition-colors cursor-pointer">
                Cancel
              </span>
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-white py-2 px-6 rounded-md font-semibold hover:bg-primary-dark transition-colors disabled:bg-neutral-400"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save and Update'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<EditArticleProps> = async (context) => {
  const { slug } = context.params || {};
  if (typeof slug !== 'string') {
    return { notFound: true };
  }

  try {
    const article = await getArticleBySlug(slug);
    if (!article) {
      return { props: { article: null } };
    }

    const { publishDate, ...rest } = article;
    const serializedArticle = {
      ...rest,
      publishDate: (publishDate && 'toDate' in publishDate) ? (publishDate as { toDate: () => Date }).toDate().toISOString() : new Date(publishDate).toISOString(),
    };

    return { props: { article: serializedArticle as unknown as SerializedArticle } };
  } catch (error) {
    console.error(`Error fetching article ${slug} for edit:`, error);
    return { props: { article: null } };
  }
};

export default EditArticlePage;
