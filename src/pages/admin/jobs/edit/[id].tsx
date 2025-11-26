import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
import AdminLayout from '@/components/AdminLayout';
import FormField from '@/components/FormField';
import RichTextEditor from '@/components/RichTextEditor';
import { getJobById } from '@/lib/firestoreClient';
import { SerializedJobPosting } from '@/lib/types';
import { calculateJobCompleteness } from '@/lib/completenessScore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { JobPostingSchema, JobFormData } from '@/lib/validationSchemas';

interface EditJobProps {
  job: SerializedJobPosting | null;
}

const EditJobPage: React.FC<EditJobProps> = ({ job }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm<JobFormData>({
    resolver: zodResolver(JobPostingSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (job) {
      const defaultValues = {
        ...job,
        tags: job.tags?.join(', ') || '',
        responsibilities: job.responsibilities?.join('\n') || '',
        qualifications: job.qualifications?.join('\n') || '',
        preferredQualifications: job.preferredQualifications?.join('\n') || '',
        postedDate: job.postedDate
          ? new Date(job.postedDate).toISOString().split('T')[0]
          : '',
        expirationDate: job.expirationDate
          ? new Date(job.expirationDate).toISOString().split('T')[0]
          : undefined,
        verificationDate: job.verificationDate
          ? new Date(job.verificationDate).toISOString().split('T')[0]
          : undefined,
        isNew: job.isNew ?? false,
        status: job.status ?? 'draft',
      };
      reset(defaultValues);
    }
  }, [job, reset]);

  const onSubmit = async (data: JobFormData) => {
    if (!job || !job.id) {
      toast.error('Cannot update a job without a valid ID.');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to perform this action.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Updating job posting...');

    try {
      const token = await user.getIdToken();

      const jobDataForSubmission = {
        ...data,
        postedDate: data.postedDate ? new Date(data.postedDate) : new Date(),
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
        verificationDate: data.verificationDate ? new Date(data.verificationDate) : undefined,
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
        tags: data.tags ? (Array.isArray(data.tags) ? data.tags : data.tags.split(',').map(t => t.trim())) : [],
        responsibilities: data.responsibilities ? (Array.isArray(data.responsibilities) ? data.responsibilities : data.responsibilities.split('\n').filter(r => r.trim() !== '')) : [],
        qualifications: data.qualifications ? (Array.isArray(data.qualifications) ? data.qualifications : data.qualifications.split('\n').filter(q => q.trim() !== '')) : [],
        preferredQualifications: data.preferredQualifications ? (Array.isArray(data.preferredQualifications) ? data.preferredQualifications : data.preferredQualifications.split('\n').filter(p => p.trim() !== '')) : [],
        excerpt: data.description ? data.description.replace(/<[^>]+>/g, '').substring(0, 160) + '...' : '',
        id: job.id,
        status: data.status || 'draft',
      };

      // Calculate completeness score before submission
      const completenessScore = calculateJobCompleteness(jobDataForSubmission);

      const response = await fetch(`/api/admin/jobs/${job.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...jobDataForSubmission, completenessScore }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update job');
      }

      const updatedJob = await response.json();

      toast.success(`Job "${updatedJob.title}" updated successfully!`, {
        id: toastId,
      });
      router.push('/admin/jobs');
    } catch (err) {
      console.error('Update error:', err);
      toast.error(
        err instanceof Error ? err.message : 'An unknown error occurred',
        { id: toastId }
      );
      setIsSubmitting(false);
    }
  };

  if (!job) {
    return (
      <AdminLayout title="Error">
        <h1 className="text-4xl font-serif font-bold text-red-600">
          Job Not Found
        </h1>
        <p className="text-neutral-600 mt-4">
          The job you are trying to edit does not exist. It may have been
          deleted.
        </p>
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
        <h1 className="text-4xl font-serif font-bold text-primary-dark">
          Edit Job Posting
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
                <FormField
                  id="title"
                  label="Job Title"
                  name="title"
                  type="text"
                  register={register}
                  error={errors.title}
                  required
                />
                <FormField
                  id="company"
                  label="Company"
                  name="company"
                  type="text"
                  register={register}
                  error={errors.company}
                  required
                />
                <FormField
                  id="location"
                  label="Location"
                  name="location"
                  type="text"
                  register={register}
                  error={errors.location}
                  required
                />
                <div className="md:col-span-2">
                  <FormField
                    id="applicationLink"
                    label="Application Link"
                    name="applicationLink"
                    type="url"
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
                  register={register}
                  error={errors.preferredQualifications}
                />
              </div>
            </div>

            {/* Other sections follow a similar pattern... */}
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-1">
            {/* Preview remains the same, but would now use watch() from react-hook-form if implemented */}
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
            {isSubmitting ? 'Saving Changes...' : 'Save and Update'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<EditJobProps> = async (
  context
) => {
  const { id } = context.params || {};
  if (typeof id !== 'string') {
    return { notFound: true };
  }

  try {
    const job = await getJobById(id);
    if (!job) {
      return { props: { job: null } };
    }

    // Simple and robust serialization
    const serializedJob = JSON.parse(JSON.stringify(job));

    return { props: { job: serializedJob } };

  } catch (error) {
    console.error(`Error fetching job ${id} for edit:`, error);
    return { props: { job: null } };
  }
};

export default EditJobPage;
