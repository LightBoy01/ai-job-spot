import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
import AdminLayout from '@/components/AdminLayout';
import { getJobById } from '@/lib/firestoreClient';
import { SerializedJobPosting, JobPosting } from '@/lib/types';
import RichTextEditor from '@/components/RichTextEditor';

type JobFormData = Partial<Omit<JobPosting, 'id' | 'postedDate' | 'expirationDate' | 'tags' | 'responsibilities' | 'qualifications' | 'description' | 'isNew' | 'status'> & {
  tags: string;
  responsibilities: string;
  qualifications: string;
  description: string;
  postedDate: string;
  expirationDate: string;
  isNew: boolean;
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
}>;

interface EditJobProps {
  job: SerializedJobPosting | null;
}

const EditJobPage: React.FC<EditJobProps> = ({ job }) => {
  const router = useRouter();
  const { idToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<JobFormData>({});

  useEffect(() => {
    if (job) {
      setFormData({
        ...job,
        tags: job.tags?.join(', ') || '',
        responsibilities: job.responsibilities?.join('\n') || '',
        qualifications: job.qualifications?.join('\n') || '',
        postedDate: job.postedDate ? new Date(job.postedDate).toISOString().split('T')[0] : '',
        expirationDate: job.expirationDate ? new Date(job.expirationDate).toISOString().split('T')[0] : '',
        isNew: job.isNew || false,
        status: job.status || 'published',
      });
    }
  }, [job]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const checked = (e.target as HTMLInputElement).type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: typeof checked === 'boolean' ? checked : value
    }));
    // Clear error when user starts typing
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleDescriptionChange = (content: string) => {
    setFormData(prev => ({ ...prev, description: content }));
    setErrors(prev => ({ ...prev, description: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) newErrors.title = 'Job Title is required.';
    if (!formData.company) newErrors.company = 'Company is required.';
    if (!formData.location) newErrors.location = 'Location is required.';
    if (!formData.description || formData.description === '<p><br></p>') newErrors.description = 'Job Description is required.';
    if (!formData.applicationLink) {
      newErrors.applicationLink = 'Application Link is required.';
    } else if (!/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/.test(formData.applicationLink)) {
      newErrors.applicationLink = 'Please enter a valid URL for the Application Link.';
    }
    if (!formData.postedDate) newErrors.postedDate = 'Posted Date is required.';

    if (formData.postedDate && formData.expirationDate) {
      const posted = new Date(formData.postedDate);
      const expiration = new Date(formData.expirationDate);
      if (expiration <= posted) {
        newErrors.expirationDate = 'Expiration Date must be after Posted Date.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    if (!validateForm()) {
      toast.error('Please correct the errors in the form.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Updating job posting...');

    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update job posting');
      }

      const result = await response.json();
      const updatedJob = result.job as SerializedJobPosting;

      toast.success(`Job "${updatedJob.title}" updated successfully!`, { id: toastId });
      router.push('/admin/jobs');
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err instanceof Error ? err.message : 'An unknown error occurred', { id: toastId });
      setIsSubmitting(false);
    }
  };

  if (!job) {
    return (
      <AdminLayout title="Error">
        <h1 className="text-4xl font-serif font-bold text-red-600">Job Not Found</h1>
        <p className="text-neutral-600 mt-4">The job you are trying to edit does not exist. It may have been deleted.</p>
        <Link href="/admin/jobs" passHref>
          <span className="mt-6 inline-block text-secondary-dark hover:text-secondary font-semibold cursor-pointer">
            &larr; Back to Jobs
          </span>
        </Link>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Edit Job: ${job.title}`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-serif font-bold text-primary-dark">Edit Job Posting</h1>
        <Link href="/admin/jobs" passHref>
          <span className="text-neutral-600 hover:text-primary-dark font-semibold cursor-pointer">
            &larr; Back to Jobs
          </span>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form Fields Column */}
          <div className="bg-neutral-50 p-8 rounded-xl shadow-lg border border-neutral-200 space-y-8">
            {/* --- Core Details Section --- */}
            <div className="border-b border-neutral-300 pb-6">
              <h2 className="text-xl font-semibold font-serif text-primary-dark mb-4">Core Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-neutral-700 mb-2">Job Title</label>
                  <input type="text" id="title" name="title" value={formData.title || ''} onChange={handleChange} className={`w-full p-3 rounded-md border ${errors.title ? 'border-red-500' : 'border-neutral-300'} outline-none transition`} required />
                  {errors.title && <span className="text-red-500 text-sm mt-1 block">{errors.title}</span>}
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-semibold text-neutral-700 mb-2">Company</label>
                  <input type="text" id="company" name="company" value={formData.company || ''} onChange={handleChange} className={`w-full p-3 rounded-md border ${errors.company ? 'border-red-500' : 'border-neutral-300'} outline-none transition`} required />
                  {errors.company && <span className="text-red-500 text-sm mt-1 block">{errors.company}</span>}
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-semibold text-neutral-700 mb-2">Location</label>
                  <input type="text" id="location" name="location" value={formData.location || ''} onChange={handleChange} className={`w-full p-3 rounded-md border ${errors.location ? 'border-red-500' : 'border-neutral-300'} outline-none transition`} required />
                  {errors.location && <span className="text-red-500 text-sm mt-1 block">{errors.location}</span>}
                </div>
                <div>
                  <label htmlFor="applicationLink" className="block text-sm font-semibold text-neutral-700 mb-2">Application Link</label>
                  <input type="url" id="applicationLink" name="applicationLink" value={formData.applicationLink || ''} onChange={handleChange} className={`w-full p-3 rounded-md border ${errors.applicationLink ? 'border-red-500' : 'border-neutral-300'} outline-none transition`} required />
                  {errors.applicationLink && <span className="text-red-500 text-sm mt-1 block">{errors.applicationLink}</span>}
                </div>
                <div>
                  <label htmlFor="jobLevel" className="block text-sm font-semibold text-neutral-700 mb-2">Job Level (e.g., Senior, Staff)</label>
                  <input type="text" id="jobLevel" name="jobLevel" value={formData.jobLevel || ''} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 outline-none transition" />
                </div>
                <div>
                  <label htmlFor="employeeRole" className="block text-sm font-semibold text-neutral-700 mb-2">Employee Role (e.g., Individual Contributor, Manager)</label>
                  <input type="text" id="employeeRole" name="employeeRole" value={formData.employeeRole || ''} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 outline-none transition" />
                </div>
              </div>
            </div>

            {/* --- Job Content Section --- */}
            <div className="border-b border-neutral-300 pb-6">
              <h2 className="text-xl font-semibold font-serif text-primary-dark mb-4">Job Content</h2>
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-neutral-700 mb-2">Job Description</label>
                <RichTextEditor
                  value={formData.description || ''}
                  onChange={handleDescriptionChange}
                  placeholder="Provide a detailed job description..."
                  className={`${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && <span className="text-red-500 text-sm mt-1 block">{errors.description}</span>}
              </div>

              <div className="mt-6">
                <label htmlFor="responsibilities" className="block text-sm font-semibold text-neutral-700 mb-2">Responsibilities (one per line)</label>
                <textarea id="responsibilities" name="responsibilities" value={formData.responsibilities || ''} onChange={handleChange} rows={5} className="w-full p-3 rounded-md border border-neutral-300 outline-none transition" placeholder="List responsibilities, one per line."></textarea>
              </div>

              <div className="mt-6">
                <label htmlFor="qualifications" className="block text-sm font-semibold text-neutral-700 mb-2">Qualifications (one per line)</label>
                <textarea id="qualifications" name="qualifications" value={formData.qualifications || ''} onChange={handleChange} rows={5} className="w-full p-3 rounded-md border border-neutral-300 outline-none transition" placeholder="List qualifications, one per line."></textarea>
              </div>
            </div>

            {/* --- Metadata & Status Section --- */}
            <div>
              <h2 className="text-xl font-semibold font-serif text-primary-dark mb-4">Metadata & Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="postedDate" className="block text-sm font-semibold text-neutral-700 mb-2">Posted Date</label>
                  <input type="date" id="postedDate" name="postedDate" value={formData.postedDate || ''} onChange={handleChange} className={`w-full p-3 rounded-md border ${errors.postedDate ? 'border-red-500' : 'border-neutral-300'} outline-none transition`} required />
                  {errors.postedDate && <span className="text-red-500 text-sm mt-1 block">{errors.postedDate}</span>}
                </div>
                <div>
                  <label htmlFor="expirationDate" className="block text-sm font-semibold text-neutral-700 mb-2">Expiration Date (Optional)</label>
                  <input type="date" id="expirationDate" name="expirationDate" value={formData.expirationDate || ''} onChange={handleChange} className={`w-full p-3 rounded-md border ${errors.expirationDate ? 'border-red-500' : 'border-neutral-300'} outline-none transition`} />
                  {errors.expirationDate && <span className="text-red-500 text-sm mt-1 block">{errors.expirationDate}</span>}
                </div>
                <div>
                  <label htmlFor="salaryRange" className="block text-sm font-semibold text-neutral-700 mb-2">Salary Range</label>
                  <input type="text" id="salaryRange" name="salaryRange" value={formData.salaryRange || ''} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 outline-none transition" />
                </div>
                <div>
                  <label htmlFor="tags" className="block text-sm font-semibold text-neutral-700 mb-2">Tags (comma-separated)</label>
                  <input type="text" id="tags" name="tags" value={formData.tags || ''} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 outline-none transition" />
                </div>
                <div className="flex items-center mt-4">
                  <input type="checkbox" id="isNew" name="isNew" checked={formData.isNew || false} onChange={handleChange} className="h-5 w-5 text-secondary-dark rounded border-neutral-300" />
                  <label htmlFor="isNew" className="ml-2 block text-sm font-semibold text-neutral-700">Mark as New</label>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-semibold text-neutral-700 mb-2">Status</label>
                  <select id="status" name="status" value={formData.status || 'published'} onChange={handleChange} className="w-full p-3 rounded-md border border-neutral-300 outline-none transition">
                    <option value="published">Published</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="draft">Draft</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="bg-neutral-50 p-8 rounded-xl shadow-lg border border-neutral-200">
            <h2 className="text-2xl font-bold text-primary-dark mb-4 border-b pb-2">Live Preview</h2>
            <div className="prose lg:prose-xl max-w-none">
              <h1 className="text-4xl font-serif font-bold text-primary-dark mb-2">{formData.title || 'Job Title Goes Here'}</h1>
              <p className="text-xl text-neutral-700 font-semibold">{formData.company || 'Company Name'}</p>
              <p className="text-md text-neutral-600 mb-6">{formData.location || 'Location'}</p>
              {formData.jobLevel && <p className="text-sm text-neutral-500">Level: {formData.jobLevel}</p>}
              {formData.employeeRole && <p className="text-sm text-neutral-500">Role: {formData.employeeRole}</p>}
              {formData.salaryRange && <p className="text-sm text-neutral-500">Salary: {formData.salaryRange}</p>}
              {formData.isNew && <span className="inline-block bg-brand-gold text-white text-xs font-bold px-2 py-1 rounded-full mt-2">NEW!</span>}
              <div
                className="job-description"
                dangerouslySetInnerHTML={{ __html: formData.description || '<p>Your job description will appear here...</p>' }}
              />
              {formData.responsibilities && (
                <>
                  <h3 className="text-xl font-semibold text-primary-dark mt-6 mb-2">Responsibilities:</h3>
                  <ul className="list-disc list-inside">
                    {formData.responsibilities.split('\n').map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
                  </ul>
                </>
              )}
              {formData.qualifications && (
                <>
                  <h3 className="text-xl font-semibold text-primary-dark mt-6 mb-2">Qualifications:</h3>
                  <ul className="list-disc list-inside">
                    {formData.qualifications.split('\n').map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
                  </ul>
                </>
              )}
            </div>
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
            {isSubmitting ? 'Saving Changes...' : 'Save and Update'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<EditJobProps> = async (context) => {
  const { id } = context.params || {};
  if (typeof id !== 'string') {
    return { notFound: true };
  }

  try {
    const job = await getJobById(id);
    if (!job) {
      return { props: { job: null } };
    }

    const { postedDate, expirationDate, ...rest } = job;
    const serializedJob = {
      ...rest,
      postedDate: (postedDate && 'toDate' in postedDate) ? (postedDate as { toDate: () => Date }).toDate().toISOString() : new Date(postedDate).toISOString(),
      expirationDate: expirationDate ? ((expirationDate && 'toDate' in expirationDate) ? (expirationDate as { toDate: () => Date }).toDate().toISOString() : new Date(expirationDate).toISOString()) : null,
    };

    return { props: { job: serializedJob as unknown as SerializedJobPosting } };
  } catch (error) {
    console.error(`Error fetching job ${id} for edit:`, error);
    return { props: { job: null } };
  }
};

export default EditJobPage;
