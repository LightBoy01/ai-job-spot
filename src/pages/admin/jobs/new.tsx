
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
import AdminLayout from '@/components/AdminLayout';
import { JobPosting } from '@/lib/types';
import RichTextEditor from '@/components/RichTextEditor';

// Use a Partial type for the form data as all fields are optional initially
type JobFormData = Partial<Omit<JobPosting, 'id' | 'postedDate' | 'expirationDate' | 'tags' | 'responsibilities' | 'qualifications' | 'description' | 'isNew' | 'status'> & {
  tags: string;
  responsibilities: string;
  qualifications: string;
  description: string;
  postedDate: string;
  expirationDate: string;
  isNew: boolean;
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
  applicationExperience: string;
  glassdoorLink: string;
  crunchbaseLink: string;
  source: string;
  companyCulture: string;
}>;

const AddNewJob: React.FC = () => {
  const router = useRouter();
  const { idToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company: '',
    description: '',
    location: '',
    applicationLink: '',
    applicationExperience: '',
    glassdoorLink: '',
    crunchbaseLink: '',
    source: '',
    jobLevel: '',
    employeeRole: '',
    salaryRange: '',
    tags: '',
    responsibilities: '',
    qualifications: '',
    postedDate: new Date().toISOString().split('T')[0], // Defaults to today
    expirationDate: '',
    isNew: true, // Default to true for new jobs
    status: 'draft',
    story_question1: "What is the most exciting challenge this person will tackle in their first 90 days?",
    story_answer1: '',
    story_question2: "What's one quality you're looking for that isn't on the formal job description?",
    story_answer2: '',
    story_question3: "How does this role contribute to the company's larger mission?",
    story_answer3: '',
    companyCulture: '',
  });

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

    if (!validateForm()) {
      toast.error('Please correct the errors in the form.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting job posting...');

    try {
      const response = await fetch('/api/jobs/post', { // Using the new unified endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(formData), // Send formData as is, status is handled by API based on admin role
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add job posting');
      }

      const result = await response.json();
      const newJob = result.job as JobPosting;

      toast.success(`Job "${newJob.title}" added successfully!`, { id: toastId });
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

      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Form Fields Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* --- Core Details Section --- */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-black/5">
              <h2 className="text-2xl font-serif font-semibold text-primary-dark border-b border-neutral-200 pb-4 mb-8">Core Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-neutral-700 mb-2">Job Title</label>
                  <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.title ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`} required />
                  {errors.title && <span className="text-red-500 text-sm mt-1 block">{errors.title}</span>}
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-semibold text-neutral-700 mb-2">Company</label>
                  <input type="text" id="company" name="company" value={formData.company} onChange={handleChange} className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.company ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`} required />
                  {errors.company && <span className="text-red-500 text-sm mt-1 block">{errors.company}</span>}
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-semibold text-neutral-700 mb-2">Location</label>
                  <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.location ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`} required />
                  {errors.location && <span className="text-red-500 text-sm mt-1 block">{errors.location}</span>}
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="applicationLink" className="block text-sm font-semibold text-neutral-700 mb-2">Application Link</label>
                  <input type="url" id="applicationLink" name="applicationLink" value={formData.applicationLink} onChange={handleChange} className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.applicationLink ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`} required />
                  {errors.applicationLink && <span className="text-red-500 text-sm mt-1 block">{errors.applicationLink}</span>}
                </div>
              </div>
            </div>

            {/* --- Job Content Section --- */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-black/5">
              <h2 className="text-2xl font-serif font-semibold text-primary-dark border-b border-neutral-200 pb-4 mb-8">Job Content</h2>
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-neutral-700 mb-2">Job Description</label>
                <RichTextEditor value={formData.description || ''} onChange={handleDescriptionChange} placeholder="Provide a detailed job description..." className={`${errors.description ? 'border-red-500' : ''}`} />
                {errors.description && <span className="text-red-500 text-sm mt-1 block">{errors.description}</span>}
              </div>
              <div className="mt-6">
                <label htmlFor="responsibilities" className="block text-sm font-semibold text-neutral-700 mb-2">Responsibilities (one per line)</label>
                <textarea id="responsibilities" name="responsibilities" value={formData.responsibilities || ''} onChange={handleChange} rows={5} className="w-full p-3 bg-neutral-50 rounded-md border border-neutral-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition" placeholder="List responsibilities, one per line."></textarea>
              </div>
              <div className="mt-6">
                <label htmlFor="qualifications" className="block text-sm font-semibold text-neutral-700 mb-2">Qualifications (one per line)</label>
                <textarea id="qualifications" name="qualifications" value={formData.qualifications || ''} onChange={handleChange} rows={5} className="w-full p-3 bg-neutral-50 rounded-md border border-neutral-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition" placeholder="List qualifications, one per line."></textarea>
              </div>
            </div>

            {/* --- Story Behind the Role Section --- */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-black/5">
                <h2 className="text-2xl font-serif font-semibold text-primary-dark border-b border-neutral-200 pb-4 mb-8">The Story Behind the Role (Optional)</h2>
                <p className="text-neutral-600 mb-6">Add authentic, human context to attract better candidates. This is highly recommended.</p>
                {/* Question 1 */}
                <div className="mb-4">
                    <label htmlFor="story_question1" className="block text-sm font-semibold text-neutral-700 mb-2">Question 1</label>
                    <input type="text" name="story_question1" id="story_question1" value={formData.story_question1 || ''} onChange={handleChange} className="w-full p-3 bg-neutral-50 rounded-md border border-neutral-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition" />
                </div>
                <div className="mb-6">
                    <label htmlFor="story_answer1" className="block text-sm font-semibold text-neutral-700 mb-2">Answer 1</label>
                    <textarea name="story_answer1" id="story_answer1" value={formData.story_answer1 || ''} onChange={handleChange} rows={4} className="w-full p-3 bg-neutral-50 rounded-md border border-neutral-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition" />
                </div>
                {/* Question 2 */}
                <div className="mb-4">
                    <label htmlFor="story_question2" className="block text-sm font-semibold text-neutral-700 mb-2">Question 2</label>
                    <input type="text" name="story_question2" id="story_question2" value={formData.story_question2 || ''} onChange={handleChange} className="w-full p-3 bg-neutral-50 rounded-md border border-neutral-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition" />
                </div>
                <div className="mb-6">
                    <label htmlFor="story_answer2" className="block text-sm font-semibold text-neutral-700 mb-2">Answer 2</label>
                    <textarea name="story_answer2" id="story_answer2" value={formData.story_answer2 || ''} onChange={handleChange} rows={4} className="w-full p-3 bg-neutral-50 rounded-md border border-neutral-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition" />
                </div>
                {/* Question 3 */}
                <div className="mb-4">
                    <label htmlFor="story_question3" className="block text-sm font-semibold text-neutral-700 mb-2">Question 3</label>
                    <input type="text" name="story_question3" id="story_question3" value={formData.story_question3 || ''} onChange={handleChange} className="w-full p-3 bg-neutral-50 rounded-md border border-neutral-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition" />
                </div>
                <div className="mb-6">
                    <label htmlFor="story_answer3" className="block text-sm font-semibold text-neutral-700 mb-2">Answer 3</label>
                    <textarea name="story_answer3" id="story_answer3" value={formData.story_answer3 || ''} onChange={handleChange} rows={4} className="w-full p-3 bg-neutral-50 rounded-md border border-neutral-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition" />
                </div>
            </div>

            {/* --- Metadata & Status Section --- */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-black/5">
              <h2 className="text-2xl font-serif font-semibold text-primary-dark border-b border-neutral-200 pb-4 mb-8">Metadata & Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="postedDate" className="block text-sm font-semibold text-neutral-700 mb-2">Posted Date</label>
                  <input type="date" id="postedDate" name="postedDate" value={formData.postedDate} onChange={handleChange} className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.postedDate ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`} required />
                  {errors.postedDate && <span className="text-red-500 text-sm mt-1 block">{errors.postedDate}</span>}
                </div>
                <div>
                  <label htmlFor="expirationDate" className="block text-sm font-semibold text-neutral-700 mb-2">Expiration Date (Optional)</label>
                  <input type="date" id="expirationDate" name="expirationDate" value={formData.expirationDate} onChange={handleChange} className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.expirationDate ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`} />
                  {errors.expirationDate && <span className="text-red-500 text-sm mt-1 block">{errors.expirationDate}</span>}
                </div>
                <div>
                  <label htmlFor="salaryRange" className="block text-sm font-semibold text-neutral-700 mb-2">Salary Range</label>
                  <input type="text" id="salaryRange" name="salaryRange" value={formData.salaryRange || ''} onChange={handleChange} className="w-full p-3 bg-neutral-50 rounded-md border border-neutral-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition" />
                </div>
                <div>
                  <label htmlFor="tags" className="block text-sm font-semibold text-neutral-700 mb-2">Tags (comma-separated)</label>
                  <input type="text" id="tags" name="tags" value={formData.tags || ''} onChange={handleChange} className="w-full p-3 bg-neutral-50 rounded-md border border-neutral-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition" />
                </div>
                <div className="flex items-center mt-4">
                  <input type="checkbox" id="isNew" name="isNew" checked={formData.isNew || false} onChange={handleChange} className="h-5 w-5 text-secondary rounded border-neutral-300 focus:ring-secondary" />
                  <label htmlFor="isNew" className="ml-2 block text-sm font-semibold text-neutral-700">Mark as New</label>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-semibold text-neutral-700 mb-2">Status</label>
                  <select id="status" name="status" value={formData.status || 'published'} onChange={handleChange} className="w-full p-3 bg-neutral-50 rounded-md border border-neutral-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition">
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
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-black/5 sticky top-24">
              <h2 className="text-2xl font-serif font-semibold text-primary-dark border-b border-neutral-200 pb-4 mb-8">Live Preview</h2>
              <div className="prose prose-lg max-w-none">
                <h3 className="text-2xl font-serif font-bold text-primary-dark mb-2">{formData.title || 'Job Title Goes Here'}</h3>
                <p className="text-lg text-neutral-700 font-semibold">{formData.company || 'Company Name'}</p>
                <p className="text-base text-neutral-600 mb-4">{formData.location || 'Location'}</p>
                <div className="job-description" dangerouslySetInnerHTML={{ __html: formData.description || '<p>Your job description will appear here...</p>' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-8 border-t border-neutral-200">
          <Link href="/admin/jobs" passHref>
            <span className="bg-neutral-200 text-neutral-800 py-3 px-6 rounded-lg font-semibold hover:bg-neutral-300 transition-colors cursor-pointer">
              Cancel
            </span>
          </Link>
          <button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:bg-neutral-400 shadow-sm">
            {isSubmitting ? 'Saving...' : 'Save and Publish'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AddNewJob;
