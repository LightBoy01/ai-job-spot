import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
import AdminLayout from '@/components/AdminLayout';
import RichTextEditor from '@/components/RichTextEditor';
import FormField from '@/components/FormField';
import { calculateJobCompleteness } from '@/lib/completenessScore';
import { Controller } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { JobPostingSchema, JobFormData } from '@/lib/validationSchemas';
import crypto from 'crypto';

const AddNewJob: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm<JobFormData>({
    resolver: zodResolver(JobPostingSchema),
    defaultValues: {
      title: '',
      company: '',
      companyLogoUrl: undefined,
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
      postedDate: new Date().toISOString().split('T')[0], // Defaults to today as a string
      expirationDate: undefined, // Should be Date or undefined, not string
      isNew: true, // Default to true for new jobs
      status: 'draft',
      story_question1:
        'What is the most exciting challenge this person will tackle in their first 90 days?',
      story_answer1: '',
      story_question2:
        "What's one quality you're looking for that isn't on the formal job description?",
      story_answer2: '',
      story_question3:
        "How does this role contribute to the company's larger mission?",
      story_answer3: '',
      companyCulture: '',
    },
  });

  const liveFormData = watch();

        const onSubmit = async (data: JobFormData) => {
          setIsSubmitting(true);
          const toastId = toast.loading('Submitting job posting...');
      
          if (!user) {
            toast.error('You must be logged in to perform this action.');
            setIsSubmitting(false);
            toast.dismiss(toastId);
            return;
          }
      
          try {
            const token = await user.getIdToken();
      
            const jobDataForSubmission = {
              ...data,
              postedDate: data.postedDate ? new Date(data.postedDate) : new Date(),
              expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
              verificationDate: (data.verificationDate ? new Date(data.verificationDate) : undefined) as Date | undefined,
              applicationExperience: data.applicationExperience ?? undefined,
              story_question1: data.story_question1 ?? undefined,
              story_answer1: data.story_answer1 ?? undefined,
              story_question2: data.story_question2 ?? undefined,
              story_answer2: data.story_answer2 ?? undefined,
              story_question3: data.story_question3 ?? undefined,
              story_answer3: data.story_answer3 ?? undefined,
              companyCulture: data.companyCulture ?? undefined,
              glassdoorLink: data.glassdoorLink ?? undefined,
              crunchbaseLink: data.crunchbaseLink ?? undefined,
              salaryRange: data.salaryRange ?? undefined,
              tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
              responsibilities: data.responsibilities ? data.responsibilities.split('\n').filter(r => r.trim() !== '') : [],
              qualifications: data.qualifications ? data.qualifications.split('\n').filter(q => q.trim() !== '') : [],
              preferredQualifications: data.preferredQualifications ? data.preferredQualifications.split('\n').filter(p => p.trim() !== '') : [],
              excerpt: data.description ? data.description.replace(/<[^>]+>/g, '').substring(0, 160) + '...' : '',
              status: data.status || 'draft',
              id: crypto.randomBytes(16).toString('hex'),
            };            // Calculate completeness score before submission
            const completenessScore = calculateJobCompleteness(jobDataForSubmission);
      
            const response = await fetch('/api/admin/jobs', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ ...jobDataForSubmission, completenessScore }),
            });      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add job');
      }

      const newJob = await response.json();

      toast.success(`Job "${newJob.title}" added successfully!`, {
        id: toastId,
      });
      router.push('/admin/jobs');
    } catch (err) {
      console.error('Submission error:', err);
      toast.error(
        err instanceof Error ? err.message : 'An unknown error occurred',
        { id: toastId }
      );
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Add New Job">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-serif font-bold text-primary-dark">
          Add New Job Posting
        </h1>
        <Link href="/admin/jobs" passHref>
          <span className="text-neutral-600 hover:text-primary-dark font-semibold cursor-pointer">
            &larr; Back to Jobs
          </span>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Form Fields Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* --- Core Details Section --- */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-black/5">
              <h2 className="text-2xl font-serif font-semibold text-primary-dark border-b border-neutral-200 pb-4 mb-8">
                Core Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <FormField
                    id="title"
                    label="Job Title"
                    name="title"
                    type="text"
                    placeholder="e.g., Senior AI Engineer"
                    register={register}
                    error={errors.title}
                    required
                  />
                </div>
                <div>
                  <FormField
                    id="company"
                    label="Company"
                    name="company"
                    type="text"
                    placeholder="e.g., Google"
                    register={register}
                    error={errors.company}
                    required
                  />
                </div>
                <div>
                  <FormField
                    id="location"
                    label="Location"
                    name="location"
                    type="text"
                    placeholder="e.g., Remote, New York, Berlin"
                    register={register}
                    error={errors.location}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <FormField
                    id="applicationLink"
                    label="Application Link"
                    name="applicationLink"
                    type="url"
                    placeholder="https://example.com/apply"
                    register={register}
                    error={errors.applicationLink}
                    required
                  />
                </div>
              </div>
            </div>

            {/* --- Job Content Section --- */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-black/5">
              <h2 className="text-2xl font-serif font-semibold text-primary-dark border-b border-neutral-200 pb-4 mb-8">
                Job Content
              </h2>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Job Description
                </label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Provide a detailed job description..."
                      className={`${errors.description ? 'border-red-500' : ''}`}
                    />
                  )}
                />
                {errors.description && (
                  <span className="text-red-500 text-sm mt-1 block">
                    {errors.description.message}
                  </span>
                )}
              </div>
              <div className="mt-6">
                <FormField
                  id="responsibilities"
                  label="Responsibilities (one per line)"
                  name="responsibilities"
                  isTextArea
                  rows={5}
                  placeholder="List responsibilities, one per line."
                  register={register}
                  error={errors.responsibilities}
                />
              </div>
              <div className="mt-6">
                <FormField
                  id="qualifications"
                  label="Qualifications (one per line)"
                  name="qualifications"
                  isTextArea
                  rows={5}
                  placeholder="List qualifications, one per line."
                  register={register}
                  error={errors.qualifications}
                />
              </div>
              <div className="mt-6">
                <FormField
                  id="preferredQualifications"
                  label="Preferred Qualifications (one per line)"
                  name="preferredQualifications"
                  isTextArea
                  rows={5}
                  placeholder="List preferred qualifications, one per line."
                  register={register}
                  error={errors.preferredQualifications}
                />
              </div>
            </div>

            {/* --- Story Behind the Role Section --- */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-black/5">
              <h2 className="text-2xl font-serif font-semibold text-primary-dark border-b border-neutral-200 pb-4 mb-8">
                The Story Behind the Role (Optional)
              </h2>
              <p className="text-neutral-600 mb-6">
                Add authentic, human context to attract better candidates. This
                is highly recommended.
              </p>
              {/* Question 1 */}
              <div className="mb-4">
                <FormField
                  id="story_question1"
                  label="Question 1"
                  name="story_question1"
                  type="text"
                  register={register}
                  error={errors.story_question1}
                />
              </div>
              <div className="mb-6">
                <FormField
                  id="story_answer1"
                  label="Answer 1"
                  name="story_answer1"
                  isTextArea
                  rows={4}
                  register={register}
                  error={errors.story_answer1}
                />
              </div>
              {/* Question 2 */}
              <div className="mb-4">
                <FormField
                  id="story_question2"
                  label="Question 2"
                  name="story_question2"
                  type="text"
                  register={register}
                  error={errors.story_question2}
                />
              </div>
              <div className="mb-6">
                <FormField
                  id="story_answer2"
                  label="Answer 2"
                  name="story_answer2"
                  isTextArea
                  rows={4}
                  register={register}
                  error={errors.story_answer2}
                />
              </div>
              {/* Question 3 */}
              <div className="mb-4">
                <FormField
                  id="story_question3"
                  label="Question 3"
                  name="story_question3"
                  type="text"
                  register={register}
                  error={errors.story_question3}
                />
              </div>
              <div className="mb-6">
                <FormField
                  id="story_answer3"
                  label="Answer 3"
                  name="story_answer3"
                  isTextArea
                  rows={4}
                  register={register}
                  error={errors.story_answer3}
                />
              </div>
              <div className="mb-6">
                <FormField
                  id="companyCulture"
                  label="Company Culture (Optional)"
                  name="companyCulture"
                  isTextArea
                  rows={4}
                  register={register}
                  error={errors.companyCulture}
                />
              </div>
            </div>

            {/* --- Metadata & Status Section --- */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-black/5">
              <h2 className="text-2xl font-serif font-semibold text-primary-dark border-b border-neutral-200 pb-4 mb-8">
                Metadata & Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <FormField
                    id="postedDate"
                    label="Posted Date"
                    name="postedDate"
                    type="date"
                    register={register}
                    error={errors.postedDate}
                    required
                  />
                </div>
                <div>
                  <FormField
                    id="expirationDate"
                    label="Expiration Date (Optional)"
                    name="expirationDate"
                    type="date"
                    register={register}
                    error={errors.expirationDate}
                  />
                </div>
                <div>
                  <FormField
                    id="salaryRange"
                    label="Salary Range"
                    name="salaryRange"
                    type="text"
                    placeholder="e.g., $100,000 - $150,000"
                    register={register}
                    error={errors.salaryRange}
                  />
                </div>
                <div>
                  <FormField
                    id="tags"
                    label="Tags (comma-separated)"
                    name="tags"
                    type="text"
                    placeholder="e.g., ML, AI, Remote"
                    register={register}
                    error={errors.tags}
                  />
                </div>
                <div className="flex items-center mt-4">
                  <FormField
                    id="isNew"
                    label="Mark as New"
                    name="isNew"
                    type="checkbox"
                    register={register}
                    error={errors.isNew}
                  />
                </div>
                <div>
                  <FormField
                    id="status"
                    label="Status"
                    name="status"
                    isSelect
                    options={[
                      { value: 'published', label: 'Published' },
                      { value: 'pending_review', label: 'Pending Review' },
                      { value: 'draft', label: 'Draft' },
                      { value: 'rejected', label: 'Rejected' },
                    ]}
                    register={register}
                    error={errors.status}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-black/5 sticky top-24">
              <h2 className="text-2xl font-serif font-semibold text-primary-dark border-b border-neutral-200 pb-4 mb-8">
                Live Preview
              </h2>
              <div className="prose prose-lg max-w-none">
                <h3 className="text-2xl font-serif font-bold text-primary-dark mb-2">
                  {liveFormData.title || 'Job Title Goes Here'}
                </h3>
                <p className="text-lg text-neutral-700 font-semibold">
                  {liveFormData.company || 'Company Name'}
                </p>
                <p className="text-base text-neutral-600 mb-4">
                  {liveFormData.location || 'Location'}
                </p>
                <div
                  className="job-description"
                  dangerouslySetInnerHTML={{
                    __html:
                      liveFormData.description ||
                      '<p>Your job description will appear here...</p>',
                  }}
                />
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
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:bg-neutral-400 shadow-sm"
          >
            {isSubmitting ? 'Saving...' : 'Save and Publish'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AddNewJob;
