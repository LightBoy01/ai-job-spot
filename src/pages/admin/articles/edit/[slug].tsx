import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
import AdminLayout from '@/components/AdminLayout';
import { getArticleBySlug } from '@/lib/firestoreClient';
import { SerializedArticle, Article } from '@/lib/types';
import RichTextEditor from '@/components/RichTextEditor';

type ArticleFormData = Partial<
  Omit<Article, 'id' | 'publishDate' | 'tags'> & {
    tags: string;
    publishDate: string;
  }
>;

interface EditArticleProps {
  article: SerializedArticle | null;
}

const EditArticlePage: React.FC<EditArticleProps> = ({ article }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ArticleFormData>({});

  useEffect(() => {
    if (article) {
      setFormData({
        ...article,
        tags: article.tags?.join(', ') || '',
        publishDate: article.publishDate
          ? new Date(article.publishDate).toISOString().split('T')[0]
          : '',
      });
    }
  }, [article]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    setFormData((prev) => ({
      ...prev,
      [name]: isNumber ? (value === '' ? undefined : Number(value)) : value,
    }));
    // Clear error when user starts typing
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleContentBodyChange = (content: string) => {
    setFormData((prev) => ({ ...prev, contentBody: content }));
    setErrors((prev) => ({ ...prev, contentBody: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) newErrors.title = 'Article Title is required.';
    if (!formData.author) newErrors.author = 'Author is required.';
    if (!formData.slug) {
      newErrors.slug = 'URL Slug is required.';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug =
        'URL Slug must be lowercase, alphanumeric, and use hyphens for spaces (e.g., my-awesome-article).';
    }
    if (!formData.publishDate)
      newErrors.publishDate = 'Publish Date is required.';
    if (!formData.contentBody || formData.contentBody === '<p><br></p>')
      newErrors.contentBody = 'Article Content is required.';

    if (
      formData.issueNo !== undefined &&
      (isNaN(formData.issueNo) || formData.issueNo <= 0)
    ) {
      newErrors.issueNo = 'Issue Number must be a positive number.';
    }
    if (
      formData.volumeNo !== undefined &&
      (isNaN(formData.volumeNo) || formData.volumeNo <= 0)
    ) {
      newErrors.volumeNo = 'Volume Number must be a positive number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article) return;

    if (!validateForm()) {
      toast.error('Please correct the errors in the form.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Updating article...');

    try {
      if (!user) {
        throw new Error('You must be logged in to perform this action.');
      }
      const token = await user.getIdToken();

      const response = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update article');
      }

      const result = await response.json();
      const updatedArticle = result.article as SerializedArticle;

      toast.success(`Article "${updatedArticle.title}" updated successfully!`, {
        id: toastId,
      });
      router.push('/admin/articles');
    } catch (err) {
      console.error('Update error:', err);
      toast.error(
        err instanceof Error ? err.message : 'An unknown error occurred',
        { id: toastId }
      );
      setIsSubmitting(false);
    }
  };

  if (!article) {
    return (
      <AdminLayout title="Error">
        <h1 className="text-4xl font-serif font-bold text-red-600">
          Article Not Found
        </h1>
        <p className="text-neutral-600 mt-4">
          The article you are trying to edit does not exist. It may have been
          deleted.
        </p>
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
        <h1 className="text-4xl font-serif font-bold text-primary-dark">
          Edit Article
        </h1>
        <Link href="/admin/articles" passHref>
          <span className="text-neutral-600 hover:text-primary-dark font-semibold cursor-pointer">
            &larr; Back to Articles
          </span>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form Fields Column */}
          <div className="bg-neutral-50 p-8 rounded-xl shadow-lg border border-neutral-200 space-y-8">
            {/* --- Article Details Section --- */}
            <div className="border-b border-neutral-300 pb-6">
              <h2 className="text-xl font-semibold font-serif text-primary-dark mb-4">
                Article Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-semibold text-neutral-700 mb-2"
                  >
                    Article Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-md border ${errors.title ? 'border-red-500' : 'border-neutral-300'} outline-none transition`}
                    required
                  />
                  {errors.title && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {errors.title}
                    </span>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="author"
                    className="block text-sm font-semibold text-neutral-700 mb-2"
                  >
                    Author
                  </label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={formData.author || ''}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-md border ${errors.author ? 'border-red-500' : 'border-neutral-300'} outline-none transition`}
                    required
                  />
                  {errors.author && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {errors.author}
                    </span>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="slug"
                    className="block text-sm font-semibold text-neutral-700 mb-2"
                  >
                    URL Slug
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug || ''}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-md border ${errors.slug ? 'border-red-500' : 'border-neutral-300'} outline-none transition`}
                    required
                  />
                  {errors.slug && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {errors.slug}
                    </span>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="publishDate"
                    className="block text-sm font-semibold text-neutral-700 mb-2"
                  >
                    Publish Date
                  </label>
                  <input
                    type="date"
                    id="publishDate"
                    name="publishDate"
                    value={formData.publishDate || ''}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-md border ${errors.publishDate ? 'border-red-500' : 'border-neutral-300'} outline-none transition`}
                    required
                  />
                  {errors.publishDate && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {errors.publishDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* --- Content Section --- */}
            <div className="border-b border-neutral-300 pb-6">
              <h2 className="text-xl font-semibold font-serif text-primary-dark mb-4">
                Content
              </h2>
              <div>
                <label
                  htmlFor="contentBody"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Article Content
                </label>
                <RichTextEditor
                  value={formData.contentBody || ''}
                  onChange={handleContentBodyChange}
                  placeholder="Write your article content here..."
                  className={`${errors.contentBody ? 'border-red-500' : ''}`}
                />
                {errors.contentBody && (
                  <span className="text-red-500 text-sm mt-1 block">
                    {errors.contentBody}
                  </span>
                )}
              </div>
            </div>

            {/* --- Metadata Section --- */}
            <div>
              <h2 className="text-xl font-semibold font-serif text-primary-dark mb-4">
                Metadata
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="tags"
                    className="block text-sm font-semibold text-neutral-700 mb-2"
                  >
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags || ''}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md border border-neutral-300 outline-none transition"
                  />
                </div>
                <div>
                  <label
                    htmlFor="volumeNo"
                    className="block text-sm font-semibold text-neutral-700 mb-2"
                  >
                    Volume No.
                  </label>
                  <input
                    type="number"
                    id="volumeNo"
                    name="volumeNo"
                    value={formData.volumeNo || ''}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-md border ${errors.volumeNo ? 'border-red-500' : 'border-neutral-300'} outline-none transition`}
                  />
                  {errors.volumeNo && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {errors.volumeNo}
                    </span>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="issueNo"
                    className="block text-sm font-semibold text-neutral-700 mb-2"
                  >
                    Issue No.
                  </label>
                  <input
                    type="number"
                    id="issueNo"
                    name="issueNo"
                    value={formData.issueNo || ''}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-md border ${errors.issueNo ? 'border-red-500' : 'border-neutral-300'} outline-none transition`}
                  />
                  {errors.issueNo && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {errors.issueNo}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="bg-neutral-50 p-8 rounded-xl shadow-lg border border-neutral-200">
            <h2 className="text-2xl font-bold text-primary-dark mb-4 border-b pb-2">
              Live Preview
            </h2>
            <div className="prose lg:prose-xl max-w-none">
              <h1 className="text-4xl font-serif font-bold text-primary-dark mb-4">
                {formData.title || 'Article Title Goes Here'}
              </h1>
              <div className="text-sm text-neutral-600 mb-6">
                <span>By {formData.author || 'Author Name'}</span>
                <span className="mx-2">|</span>
                <span>
                  Published on:{' '}
                  {formData.publishDate
                    ? new Date(formData.publishDate).toLocaleDateString(
                        'en-US',
                        { year: 'numeric', month: 'long', day: 'numeric' }
                      )
                    : 'Select a date'}
                </span>
              </div>
              <div
                className="article-content"
                dangerouslySetInnerHTML={{
                  __html:
                    formData.contentBody ||
                    '<p>Your article content will appear here...</p>',
                }}
              />
            </div>
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
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<EditArticleProps> = async (
  context
) => {
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
      publishDate: publishDate
        ? 'toDate' in publishDate
          ? (publishDate as { toDate: () => Date }).toDate().toISOString()
          : new Date(publishDate).toISOString()
        : null,
    };

    return {
      props: { article: serializedArticle as unknown as SerializedArticle },
    };
  } catch (error) {
    console.error(`Error fetching article ${slug} for edit:`, error);
    return { props: { article: null } };
  }
};

export default EditArticlePage;
