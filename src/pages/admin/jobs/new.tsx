
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
import AdminLayout from '@/components/AdminLayout';
import { JobPosting } from '@/lib/types';

// Use a Partial type for the form data as all fields are optional initially
type JobFormData = Partial<Omit<JobPosting, 'id' | 'postedDate' | 'expirationDate' | 'tags' | 'responsibilities' | 'qualifications'> & {
  tags: string;
  responsibilities: string;
  qualifications: string;
  postedDate: string;
  expirationDate: string;
}>;

const AddNewJob: React.FC = () => {
  const router = useRouter();
  const { idToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company: '',
    description: '',
    location: '',
    applicationLink: '',
    jobLevel: '',
    employeeRole: '',
    salaryRange: '',
    tags: '',
    responsibilities: '',
    qualifications: '',
    postedDate: new Date().toISOString().split('T')[0], // Defaults to today
    expirationDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading('Submitting job posting...');

    try {
      const response = await fetch('/api/jobs/post', { // Using the new unified endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ ...formData, status: 'published' }), // Default to published for admin
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add job posting');
      }

      toast.success('Job posting added successfully!', { id: toastId });
      router.push('/admin/jobs');
    } catch (err) {
      console.error('Submission error:', err);
      toast.error(err instanceof Error ? err.message : 'An unknown error occurred', { id: toastId });
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Add New Job">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-serif font-bold text-primary-dark">Add New Job Posting</h1>
        <Link href="/admin/jobs" passHref>
          <span className="text-neutral-600 hover:text-primary-dark font-semibold cursor-pointer">
            &larr; Back to Jobs
          </span>
        </Link>
      </div>

      <div className="bg-neutral-50 p-8 rounded-xl shadow-lg border border-neutral-200">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-neutral-700 mb-2">Job Title</label>
              <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition" required />
            </div>
            <div>
              <label htmlFor="company" className="block text-sm font-semibold text-neutral-700 mb-2">Company</label>
              <input type="text" id="company" name="company" value={formData.company} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition" required />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-neutral-700 mb-2">Location</label>
              <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition" required />
            </div>
            <div>
              <label htmlFor="applicationLink" className="block text-sm font-semibold text-neutral-700 mb-2">Application Link</label>
              <input type="url" id="applicationLink" name="applicationLink" value={formData.applicationLink} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition" required />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-neutral-700 mb-2">Job Description (HTML supported)</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={10} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition font-mono text-sm" required></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="postedDate" className="block text-sm font-semibold text-neutral-700 mb-2">Posted Date</label>
              <input type="date" id="postedDate" name="postedDate" value={formData.postedDate} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition" required />
            </div>
            <div>
              <label htmlFor="expirationDate" className="block text-sm font-semibold text-neutral-700 mb-2">Expiration Date (Optional)</label>
              <input type="date" id="expirationDate" name="expirationDate" value={formData.expirationDate} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition" />
            </div>
            <div>
              <label htmlFor="salaryRange" className="block text-sm font-semibold text-neutral-700 mb-2">Salary Range</label>
              <input type="text" id="salaryRange" name="salaryRange" value={formData.salaryRange} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition" />
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-semibold text-neutral-700 mb-2">Tags (comma-separated)</label>
              <input type="text" id="tags" name="tags" value={formData.tags} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 focus:ring-2 focus:ring-secondary-dark outline-none transition" />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-10">
            <Link href="/admin/jobs" passHref>
              <span className="bg-neutral-200 text-neutral-800 py-2 px-6 rounded-md font-semibold hover:bg-neutral-300 transition-colors cursor-pointer">
                Cancel
              </span>
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-white py-2 px-6 rounded-md font-semibold hover:bg-primary-dark transition-colors disabled:bg-neutral-400"
            >
              {isSubmitting ? 'Saving...' : 'Save and Publish'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddNewJob;
