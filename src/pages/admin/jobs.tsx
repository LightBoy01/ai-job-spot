import AdminLayout from '@/components/AdminLayout';
import { SerializedJobPosting } from '@/lib/types';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { formatDate } from '@/lib/dateUtils';
import { useAdminResourceList } from '@/hooks/useAdminResourceList';

interface AdminJobsProps {
  initialJobs: SerializedJobPosting[];
  initialLastDocId: string | null;
  error?: string;
}

const PAGE_SIZE = 10;

const AdminJobs: React.FC<AdminJobsProps> = ({
  initialJobs,
  initialLastDocId,
  error,
}) => {
  useEffect(() => {
    if (error) {
      toast.error(`Error loading jobs: ${error}`);
    }
  }, [error]);

  const {
    items: jobs,
    isLoading,
    searchQuery,
    setSearchQuery,
    lastDocId,
    handleSearchSubmit,
    handleClearSearch,
    loadMore,
    handleDeleteClick,
    confirmationModalProps,
  } = useAdminResourceList({
    initialItems: initialJobs,
    initialLastDocId,
    resourceName: 'job',
    searchApiUrl: '/api/admin/jobs/search',
    deleteApiUrlBase: '/api/jobs',
  });

  return (
    <AdminLayout title="Manage Jobs">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-serif font-bold text-primary-dark">
          Manage Job Postings
        </h1>
        <Link href="/admin/jobs/new" passHref>
          <span className="inline-block bg-secondary text-white py-2 px-6 rounded-md font-semibold hover:bg-secondary-dark transition-colors cursor-pointer">
            + Add New Job
          </span>
        </Link>
      </div>

      <div className="mb-6">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by job title..."
            className="w-full max-w-md p-3 rounded-md border border-neutral-300 outline-none transition"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary text-white py-3 px-6 rounded-md font-semibold hover:bg-primary-dark transition-colors disabled:bg-neutral-400"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={handleClearSearch}
            className="bg-neutral-200 text-neutral-800 py-3 px-5 rounded-md font-semibold hover:bg-neutral-300 transition-colors"
          >
            Clear
          </button>
        </form>
      </div>

      <div className="bg-neutral-50 p-8 rounded-xl shadow-lg border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-neutral-300">
              <tr>
                <th className="py-3 px-4 text-sm font-semibold text-neutral-600 uppercase">
                  Title
                </th>
                <th className="py-3 px-4 text-sm font-semibold text-neutral-600 uppercase">
                  Company
                </th>
                <th className="py-3 px-4 text-sm font-semibold text-neutral-600 uppercase">
                  Posted
                </th>
                <th className="py-3 px-4 text-sm font-semibold text-neutral-600 uppercase">
                  Status
                </th>
                <th className="py-3 px-4 text-sm font-semibold text-neutral-600 uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-neutral-100 transition-colors"
                >
                  <td className="py-4 px-4 whitespace-nowrap font-medium text-neutral-800">
                    {job.title}
                  </td>
                  <td className="py-4 px-4 text-neutral-600">{job.company}</td>
                  <td className="py-4 px-4 text-neutral-600">
                    {formatDate(job.postedDate)}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        job.status === 'published'
                          ? 'bg-accent-light text-accent-dark'
                          : 'bg-secondary-light text-secondary-dark'
                      }`}
                    >
                      {job.status || 'draft'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    <Link href={`/admin/jobs/edit/${job.id}`} passHref>
                      <span
                        className={`text-secondary-dark hover:text-secondary font-semibold ${
                          isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        Edit
                      </span>
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(job.id!, job.title)}
                      disabled={isLoading}
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
            onClick={loadMore}
            disabled={!lastDocId || isLoading}
            className="bg-primary text-white py-2 px-4 rounded-md font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Load More
          </button>
        </div>
      </div>

      <ConfirmationModal {...confirmationModalProps} />
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<AdminJobsProps> = async (
  context
) => {
  try {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = context.req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const params = new URLSearchParams({ q: '', limit: String(PAGE_SIZE) });
    // The Authorization header is no longer needed here either.
    // The browser will forward the cookie to the API route automatically.
    const response = await fetch(
      `${baseUrl}/api/admin/jobs/search?${params.toString()}`,
      {
        headers: { Cookie: context.req.headers.cookie || '' },
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { redirect: { destination: '/admin/login', permanent: false } };
      }
      throw new Error(`Failed to fetch initial jobs: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      props: { initialJobs: data.jobs, initialLastDocId: data.lastDocId },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(
      '[getServerSideProps] Error fetching jobs for admin panel:',
      error
    );
    return { props: { initialJobs: [], initialLastDocId: null, error: errorMessage } };
  }
};

export default AdminJobs;
