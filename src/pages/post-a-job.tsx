/* eslint-disable react/no-unescaped-entities */
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
  story_question1: string;
  story_answer1: string;
  salaryRange?: string; // New field
  tags?: string; // New field
  jobLevel?: string; // New field
  employeeRole?: string; // New field
  responsibilities?: string; // New field
  qualifications?: string; // New field
  preferredQualifications?: string; // New field
  applicationExperience?: string; // New field
  glassdoorLink?: string; // New field
  crunchbaseLink?: string; // New field
  companyCulture?: string; // New field
  expirationDate?: string; // New field
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
    story_question1: '',
    story_answer1: '',
    salaryRange: '', // Initialize new field
    tags: '', // Initialize new field
    jobLevel: '', // Initialize new field
    employeeRole: '', // Initialize new field
    responsibilities: '', // Initialize new field
    qualifications: '', // Initialize new field
    preferredQualifications: '', // Initialize new field
    applicationExperience: '', // Initialize new field
    glassdoorLink: '', // Initialize new field
    crunchbaseLink: '', // Initialize new field
    companyCulture: '', // Initialize new field
    expirationDate: '', // Initialize new field
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
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.contactEmail)
    ) {
      newErrors.contactEmail = 'A valid Contact Email is required.';
    }
    // Proof of Work Validation
    if (!formData.story_question1) {
      newErrors.story_question1 = 'Human Context Question is required.';
    }
    if (!formData.story_answer1) {
      newErrors.story_answer1 = 'Human Context Q&A is required.';
    } else if (formData.story_answer1.length < 200) {
      newErrors.story_answer1 = 'Human Context Q&A must be at least 200 characters.';
    } else {
      const urlRegex = /(https?:\/\/[^\\s]+)/g;
      const matches = formData.story_answer1.match(urlRegex);
      if (matches && matches.length > 1) {
        newErrors.story_answer1 = 'Human Context Q&A can contain at most one hyperlink.';
      }
    }

    // Additional Job Details Validation
    if (formData.glassdoorLink && !/^https?:\/\/.+/.test(formData.glassdoorLink)) {
      newErrors.glassdoorLink = 'Must be a valid URL.';
    }
    if (formData.crunchbaseLink && !/^https?:\/\/.+/.test(formData.crunchbaseLink)) {
      newErrors.crunchbaseLink = 'Must be a valid URL.';
    }
    if (formData.expirationDate) {
      const posted = new Date(); // Assuming postedDate is now for public form
      const expiration = new Date(formData.expirationDate);
      if (expiration <= posted) {
        newErrors.expirationDate = 'Expiration Date must be after today.';
      }
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

          <div className="bg-white p-8 rounded-xl shadow-sm border border-black/5 mt-10">
            <h2 className="text-2xl font-serif font-semibold text-primary-dark border-b border-neutral-200 pb-4 mb-8">
              Proof of Work: Human Context Q&A
            </h2>
            <p className="text-neutral-600 mb-6">
              To ensure authenticity and quality for our audience, please provide a unique, human-written answer to the following question. This helps us understand your company's vision and culture.
            </p>
            <div className="space-y-8">
              <div>
                <label
                  htmlFor="story_question1"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Human Context Question (e.g., "What unique challenge does your team solve with AI?")
                </label>
                <textarea
                  id="story_question1"
                  name="story_question1"
                  value={formData.story_question1}
                  onChange={handleChange}
                  rows={2}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.story_question1 ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                  placeholder="Enter your question here&quot;..."
                ></textarea>
                {errors.story_question1 && (
                  <p className="text-red-500 text-sm mt-1">{errors.story_question1}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="story_answer1"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Your Answer (Min 200 characters, Max 1 hyperlink)
                </label>
                <textarea
                  id="story_answer1"
                  name="story_answer1"
                  value={formData.story_answer1}
                  onChange={handleChange}
                  rows={6}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.story_answer1 ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                  placeholder="Provide a detailed, human-written answer to the question above. This helps us verify authenticity and showcase your company&apos;s unique perspective."
                ></textarea>
                {errors.story_answer1 && (
                  <p className="text-red-500 text-sm mt-1">{errors.story_answer1}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-black/5 mt-10">
            <h2 className="text-2xl font-serif font-semibold text-primary-dark border-b border-neutral-200 pb-4 mb-8">
              Additional Job Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label
                  htmlFor="salaryRange"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Salary Range (e.g., $100,000 - $150,000)
                </label>
                <input
                  type="text"
                  id="salaryRange"
                  name="salaryRange"
                  value={formData.salaryRange}
                  onChange={handleChange}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.salaryRange ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                />
                {errors.salaryRange && (
                  <p className="text-red-500 text-sm mt-1">{errors.salaryRange}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="expirationDate"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  id="expirationDate"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.expirationDate ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                />
                {errors.expirationDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.expirationDate}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="tags"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Tags (Comma-separated, e.g., AI, ML, Remote)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.tags ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                />
                {errors.tags && (
                  <p className="text-red-500 text-sm mt-1">{errors.tags}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="jobLevel"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Job Level (e.g., Senior, Staff, Principal)
                </label>
                <input
                  type="text"
                  id="jobLevel"
                  name="jobLevel"
                  value={formData.jobLevel}
                  onChange={handleChange}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.jobLevel ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                />
                {errors.jobLevel && (
                  <p className="text-red-500 text-sm mt-1">{errors.jobLevel}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="employeeRole"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Employee Role (e.g., Individual Contributor, Manager)
                </label>
                <input
                  type="text"
                  id="employeeRole"
                  name="employeeRole"
                  value={formData.employeeRole}
                  onChange={handleChange}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.employeeRole ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                />
                {errors.employeeRole && (
                  <p className="text-red-500 text-sm mt-1">{errors.employeeRole}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="responsibilities"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Responsibilities (One per line)
                </label>
                <textarea
                  id="responsibilities"
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.responsibilities ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                  placeholder="List key responsibilities, one per line."
                ></textarea>
                {errors.responsibilities && (
                  <p className="text-red-500 text-sm mt-1">{errors.responsibilities}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="qualifications"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Qualifications (One per line)
                </label>
                <textarea
                  id="qualifications"
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.qualifications ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                  placeholder="List required qualifications, one per line."
                ></textarea>
                {errors.qualifications && (
                  <p className="text-red-500 text-sm mt-1">{errors.qualifications}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="preferredQualifications"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Preferred Qualifications (Optional, one per line)
                </label>
                <textarea
                  id="preferredQualifications"
                  name="preferredQualifications"
                  value={formData.preferredQualifications}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.preferredQualifications ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                  placeholder="List preferred qualifications, one per line."
                ></textarea>
                {errors.preferredQualifications && (
                  <p className="text-red-500 text-sm mt-1">{errors.preferredQualifications}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="applicationExperience"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Application Experience (e.g., "15-20 min application")
                </label>
                <input
                  type="text"
                  id="applicationExperience"
                  name="applicationExperience"
                  value={formData.applicationExperience}
                  onChange={handleChange}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.applicationExperience ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                />
                {errors.applicationExperience && (
                  <p className="text-red-500 text-sm mt-1">{errors.applicationExperience}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="glassdoorLink"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Glassdoor Link (Optional)
                </label>
                <input
                  type="url"
                  id="glassdoorLink"
                  name="glassdoorLink"
                  value={formData.glassdoorLink}
                  onChange={handleChange}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.glassdoorLink ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                  placeholder="https://..."
                />
                {errors.glassdoorLink && (
                  <p className="text-red-500 text-sm mt-1">{errors.glassdoorLink}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="crunchbaseLink"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Crunchbase Link (Optional)
                </label>
                <input
                  type="url"
                  id="crunchbaseLink"
                  name="crunchbaseLink"
                  value={formData.crunchbaseLink}
                  onChange={handleChange}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.crunchbaseLink ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                  placeholder="https://..."
                />
                {errors.crunchbaseLink && (
                  <p className="text-red-500 text-sm mt-1">{errors.crunchbaseLink}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="companyCulture"
                  className="block text-sm font-semibold text-neutral-700 mb-2"
                >
                  Company Culture (Optional, HTML allowed)
                </label>
                <textarea
                  id="companyCulture"
                  name="companyCulture"
                  value={formData.companyCulture}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full p-3 bg-neutral-50 rounded-md border ${errors.companyCulture ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`}
                  placeholder="Describe your company&apos;s culture, values, and what makes it a great place to work."
                ></textarea>
                {errors.companyCulture && (
                  <p className="text-red-500 text-sm mt-1">{errors.companyCulture}</p>
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
