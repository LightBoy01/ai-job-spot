import AdminLayout from '@/components/AdminLayout';
import { SerializedJobPosting } from '@/lib/types';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
import { getPendingJobs } from '@/lib/firestoreClient';
import { useState, useCallback } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';

interface AdminReviewsProps {
  initialJobs: SerializedJobPosting[];
}

const AdminReviews: React.FC<AdminReviewsProps> = ({ initialJobs }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState(initialJobs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobToReject, setJobToReject] = useState<string | null>(null);

  const updateJobStatus = useCallback(
    async (id: string, status: 'published' | 'rejected') => {
      if (!user) {
        toast.error('You must be logged in to perform this action.');
        return;
      }

      const toastId = toast.loading(`Updating status to ${status}...`);
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/admin/jobs/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Failed to set status to ${status}`
          );
        }

        toast.success(`Job status updated to ${status}!`, { id: toastId });
        setJobs((currentJobs) => currentJobs.filter((job) => job.id !== id));
      } catch (error) {
        console.error(`Error updating job status to ${status}:`, error);
        toast.error(
          error instanceof Error ? error.message : 'An unknown error occurred',
          { id: toastId }
        );
      }
    },
    [user]
  );

  const handleApprove = (id: string) => {
    updateJobStatus(id, 'published');
  };

  const handleRejectClick = (id: string) => {
    setJobToReject(id);
    setIsModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!jobToReject) return;
    updateJobStatus(jobToReject, 'rejected');
    setIsModalOpen(false);
    setJobToReject(null);
  };

  return (
    <AdminLayout title="Pending Job Reviews">
      <h1 className="text-4xl font-serif font-bold text-primary-dark mb-8">
        Job Postings Pending Review
      </h1>

      <div className="bg-neutral-50 p-8 rounded-xl shadow-lg border border-neutral-200">
        {jobs.length > 0 ? (
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
                    <td className="py-4 px-4 text-neutral-600">
                      {job.company}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <Link
                        href={`/admin/jobs/edit/${job.id}?review=true`}
                        passHref
                      >
                        <span className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer">
                          Review & Edit
                        </span>
                      </Link>
                      <button
                        onClick={() => handleApprove(job.id!)}
                        className="text-green-600 hover:text-green-800 font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectClick(job.id!)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-neutral-600 py-12">
            No jobs are currently pending review.
          </p>
        )}
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmReject}
        title="Confirm Rejection"
        message="Are you sure you want to reject this job posting? This action cannot be undone."
        confirmText="Reject"
      />
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<
  AdminReviewsProps
> = async () => {
  try {
    const jobs = await getPendingJobs();
    const serializedJobs = jobs.map((job) => {
      const { postedDate, expirationDate, ...rest } = job;
      return {
        ...rest,
        postedDate:
          postedDate && 'toDate' in postedDate
            ? (postedDate as { toDate: () => Date }).toDate().toISOString()
            : new Date(postedDate).toISOString(),
        expirationDate: expirationDate
          ? expirationDate && 'toDate' in expirationDate
            ? (expirationDate as { toDate: () => Date }).toDate().toISOString()
            : new Date(expirationDate).toISOString()
          : null,
      };
    });
    return {
      props: {
        initialJobs: serializedJobs as unknown as SerializedJobPosting[],
      },
    };
  } catch (error) {
    console.error('Error fetching pending jobs for admin panel:', error);
    return { props: { initialJobs: [] } };
  }
};

export default AdminReviews;
