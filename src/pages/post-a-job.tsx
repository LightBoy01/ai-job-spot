import React, { useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import Head from 'next/head';

type PublicJobFormData = {
  title: string;
  company: string;
  companyLogoUrl?: string;
  location: string;
  applicationLink: string;
  description: string;
  contactEmail: string; // For notifications and verification
};

const PostAJobPage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof PublicJobFormData, string>>
  >({});

  const [formData, setFormData] = useState<PublicJobFormData>({
    title: '',
    company: '',
    companyLogoUrl: '',
    location: '',
    applicationLink: '',
    description: '',
    contactEmail: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PublicJobFormData, string>> = {};
    if (!formData.title) newErrors.title = 'Job Title is required.';
    if (!formData.company) newErrors.company = 'Company is required.';
    if (!formData.location) newErrors.location = 'Location is required.';
    if (!formData.description)
      newErrors.description = 'Description is required.';
    if (
      !formData.applicationLink ||
      !/^https?:\/\/.+/.test(formData.applicationLink)
    ) {
      newErrors.applicationLink = 'A valid Application URL is required.';
    }
    if (
      !formData.contactEmail ||
      !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.contactEmail)
    ) {
      newErrors.contactEmail = 'A valid Contact Email is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please correct the errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting your job for review...');

    try {
      // This API endpoint will be created in the next step.
      const response = await fetch('/api/jobs/public-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An unknown error occurred.');
      }

      toast.success('Thank you! Your job has been submitted for review.', {
        id: toastId,
        duration: 6000,
      });
      router.push('/'); // Redirect to homepage after successful submission
    } catch (err) {
      console.error('Submission error:', err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to submit job.',
        { id: toastId }
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Post a Job | AI Job Spot</title>
        <meta
          name="description"
          content="Submit a job to be featured on AI Job Spot, the premier destination for AI talent."
        />
        <meta name="robots" content="noindex, follow" />
      </Head>

      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="page-title">Post a Job Opportunity</h1>
          <p className="mt-4 text-lg text-neutral-600 max-w-2xl mx-auto">
            Submit your job listing to be featured on AI Job Spot. All
            submissions are reviewed by our team to ensure quality and
            authenticity for our audience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-black/5">
            <h2 className="text-2xl font-serif font-semibold text-primary-dark border-b border-neutral-200 pb-4 mb-8">
              Employer & Job Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Company Name
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.company ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                />
                {errors.company && (
                  <p className="text-red-500 text-sm mt-1">{errors.company}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="contactEmail"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Your Contact Email
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.contactEmail ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                />
                {errors.contactEmail && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.contactEmail}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Job Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.title ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Location (e.g., San Francisco, CA)
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.location ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="applicationLink"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Application Link
                </label>
                <input
                  type="url"
                  id="applicationLink"
                  name="applicationLink"
                  value={formData.applicationLink}
                  onChange={handleChange}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.applicationLink ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                  placeholder="https://..."
                />
                {errors.applicationLink && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.applicationLink}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Job Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={8}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.description ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                  placeholder="Provide a detailed description of the role, responsibilities, and qualifications."
                ></textarea>
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:bg-neutral-400 shadow-sm"
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default PostAJobPage;
