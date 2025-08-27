import AdminLayout from '@/components/AdminLayout';
import { SerializedJobPosting } from '@/lib/types';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { formatDate } from '@/lib/dateUtils';

interface AdminJobsProps {
  initialJobs: SerializedJobPosting[];
  initialLastDocId: string | null;
}

const PAGE_SIZE = 10; // Define page size

const AdminJobs: React.FC<AdminJobsProps> = ({ initialJobs, initialLastDocId }) => {
  const { idToken, loading: authLoading } = useAuth(); // Destructure loading as authLoading to avoid name collision
  const [jobs, setJobs] = useState(initialJobs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobToDeleteId, setJobToDeleteId] = useState<string | null>(null);
  const [jobToDeleteTitle, setJobToDeleteTitle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lastDocId, setLastDocId] = useState<string | null>(initialLastDocId);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageHistory, setPageHistory] = useState<string[]>([]); // Stack to store firstDocId of each page

  useEffect(() => {
    // Reset pagination when search query changes or is cleared
    if (!searchQuery) {
      setJobs(initialJobs);
      setLastDocId(initialLastDocId);
      setCurrentPage(1);
      setPageHistory([]);
    }
  }, [searchQuery, initialJobs, initialLastDocId]);

  const fetchJobs = async (startAfterId: string | null = null, direction: 'next' | 'prev' | 'initial' = 'initial') => {
    if (!idToken) return;

    setIsSearching(true); // Use isSearching to disable buttons during fetch
    const toastId = toast.loading(direction === 'next' ? 'Loading next page...' : direction === 'prev' ? 'Loading previous page...' : 'Loading jobs...');

    try {
      let url = `/api/jobs/paginate?limit=${PAGE_SIZE}`;
      if (startAfterId && direction === 'next') {
        url += `&startAfter=${startAfterId}`;
      } else if (startAfterId && direction === 'prev') {
        // For previous, we need to fetch from the beginning up to the current firstDocId
        // This is a simplified approach; a more robust solution would involve storing more history
        // For simplicity, we'll just go back to the previous page's start ID
        url = `/api/jobs/paginate?limit=${PAGE_SIZE}`;
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
        throw new Error(errorData.error || 'Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data.jobs);
      setLastDocId(data.lastDocId);

      

      if (direction === 'next') {
        setPageHistory(prev => [...prev, startAfterId || 'initial']);
        setCurrentPage(prev => prev + 1);
      } else if (direction === 'prev') {
        setPageHistory(prev => prev.slice(0, prev.length - 1));
        setCurrentPage(prev => prev - 1);
      } else if (direction === 'initial' && data.jobs.length > 0) {
        setPageHistory([data.jobs[0].id]);
      }

      toast.success('Jobs loaded.', { id: toastId });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred', { id: toastId });
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteClick = (id: string, title: string) => {
    setJobToDeleteId(id);
    setJobToDeleteTitle(title);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDeleteId) return;
    setIsModalOpen(false);
    const toastId = toast.loading(`Deleting job "${jobToDeleteTitle || ''}"...`);

    try {
      const response = await fetch(`/api/jobs/${jobToDeleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete job');
      }

      toast.success(`Job "${jobToDeleteTitle || ''}" deleted successfully!`, { id: toastId });
      // Re-fetch jobs after deletion to update the list and pagination state
      fetchJobs(pageHistory[pageHistory.length - 1] || null, 'initial');
    } catch (error) {
      console.error('Error deleting job:', error);
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
      const response = await fetch(`/api/jobs/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search jobs');
      }

      const searchResults = await response.json();
      setJobs(searchResults);
      setLastDocId(null); // Disable pagination after search
      
      setCurrentPage(1);
      setPageHistory([]);
      toast.success(`${searchResults.length} job(s) found.`, { id: toastId });
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred', { id: toastId });
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    // Re-fetch initial jobs to reset pagination
    fetchJobs(null, 'initial');
  };

  return (
    <AdminLayout title="Manage Jobs">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-serif font-bold text-primary-dark">Manage Job Postings</h1>
        <Link href="/admin/jobs/new" passHref>
          <span className="inline-block bg-secondary text-white py-2 px-6 rounded-md font-semibold hover:bg-secondary-dark transition-colors cursor-pointer">
            + Add New Job
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
            placeholder="Search by job title..."
            className="w-full max-w-md p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition"
          />
          <button type="submit" disabled={isSearching || authLoading || !idToken} className="bg-primary text-white py-3 px-6 rounded-md font-semibold hover:bg-primary-dark transition-colors disabled:bg-neutral-400">
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
                <th className="py-3 px-4 text-sm font-semibold text-neutral-600 uppercase">Company</th>
                <th className="py-3 px-4 text-sm font-semibold text-neutral-600 uppercase">Posted</th>
                <th className="py-3 px-4 text-sm font-semibold text-neutral-600 uppercase">Status</th>
                <th className="py-3 px-4 text-sm font-semibold text-neutral-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-neutral-100 transition-colors">
                  <td className="py-4 px-4 whitespace-nowrap font-medium text-neutral-800">{job.title}</td>
                  <td className="py-4 px-4 text-neutral-600">{job.company}</td>
                  <td className="py-4 px-4 text-neutral-600">{formatDate(job.postedDate)}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${job.status === 'published' ? 'bg-accent-light text-accent-dark' : 'bg-secondary-light text-secondary-dark'}`}>
                      {job.status || 'draft'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    <Link href={`/admin/jobs/edit/${job.id}`} passHref>
                      <span className={`text-secondary-dark hover:text-secondary font-semibold ${authLoading || !idToken ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(job.id!, job.title)}
                      disabled={authLoading || !idToken}
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

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => fetchJobs(pageHistory[pageHistory.length - 2] || null, 'prev')}
            disabled={currentPage === 1 || isSearching || authLoading || !idToken}
            className="bg-neutral-200 text-neutral-800 py-2 px-4 rounded-md font-semibold hover:bg-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-neutral-600">Page {currentPage}</span>
          <button
            onClick={() => fetchJobs(lastDocId, 'next')}
            disabled={!lastDocId || isSearching || authLoading || !idToken}
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
        message="Are you sure you want to delete this job posting? This action is permanent and cannot be undone."
      />
    </AdminLayout>
  );
};

import { parse } from 'cookie'; // Import parse from 'cookie'

export const getServerSideProps: GetServerSideProps<AdminJobsProps> = async (context) => {
  try {
    const PAGE_SIZE = 10; // Must match frontend PAGE_SIZE
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = context.req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // Read the __session cookie
    const cookies = parse(context.req.headers.cookie || '');
    const idToken = cookies.__session;

    console.log(`[getServerSideProps] Fetching from: ${baseUrl}/api/jobs/paginate?limit=${PAGE_SIZE}`);
    const response = await fetch(`${baseUrl}/api/jobs/paginate?limit=${PAGE_SIZE}`, {
      headers: {
        'Authorization': idToken ? `Bearer ${idToken}` : '', // Use the idToken from the cookie
      },
    });
    
    console.log(`[getServerSideProps] Response status: ${response.status}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getServerSideProps] Failed to fetch initial jobs: ${response.status} - ${errorText}`);
      throw new Error(`Failed to fetch initial jobs: ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`[getServerSideProps] Received data:`, data);

    return { props: { initialJobs: data.jobs, initialLastDocId: data.lastDocId } };
  } catch (error) {
    console.error("[getServerSideProps] Error fetching jobs for admin panel:", error);
    return { props: { initialJobs: [], initialLastDocId: null } };
  }
};

export default AdminJobs;