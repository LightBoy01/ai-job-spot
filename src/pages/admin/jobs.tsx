import AdminLayout from '@/components/AdminLayout';
import { SerializedJobPosting } from '@/lib/types';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
import { getJobs } from '@/lib/firestoreClient';
import { useState } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { formatDate } from '@/lib/dateUtils';

interface AdminJobsProps {
  initialJobs: SerializedJobPosting[];
}

const AdminJobs: React.FC<AdminJobsProps> = ({ initialJobs }) => {
  const { idToken } = useAuth();
  const [jobs, setJobs] = useState(initialJobs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobToDeleteId, setJobToDeleteId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setJobToDeleteId(id);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDeleteId) return;
    setIsModalOpen(false);
    const toastId = toast.loading('Deleting job posting...');

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

      toast.success('Job deleted successfully', { id: toastId });
      setJobs(currentJobs => currentJobs.filter(job => job.id !== jobToDeleteId));
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred', { id: toastId });
    }
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
                      <span className="text-secondary-dark hover:text-secondary font-semibold cursor-pointer">Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(job.id!)}
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
        message="Are you sure you want to delete this job posting? This action is permanent and cannot be undone."
      />
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<AdminJobsProps> = async () => {
  // This should be protected by middleware or a higher-order component
  // For now, we fetch the data and assume auth is handled on the client
  try {
    const { jobs } = await getJobs(); // Destructure to get the jobs array
    const serializedJobs = jobs.map(job => {
      const { postedDate, expirationDate, ...rest } = job;
      return {
        ...rest,
        postedDate: (postedDate && 'toDate' in postedDate) ? (postedDate as { toDate: () => Date }).toDate().toISOString() : new Date(postedDate).toISOString(),
        expirationDate: expirationDate ? ((expirationDate && 'toDate' in expirationDate) ? (expirationDate as { toDate: () => Date }).toDate().toISOString() : new Date(expirationDate).toISOString()) : null,
      };
    });
    return { props: { initialJobs: serializedJobs as unknown as SerializedJobPosting[] } };
  } catch (error) {
    console.error("Error fetching jobs for admin panel:", error);
    return { props: { initialJobs: [] } };
  }
};

export default AdminJobs;
