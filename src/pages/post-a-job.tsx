
import { useState } from 'react';
import Layout from '@/components/Layout';
import Head from 'next/head';
import toast, { Toaster } from 'react-hot-toast';

const PostAJobPage = () => {
  const [formState, setFormState] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    applyLink: '',
    posterEmail: '',
    salaryRange: '',
    tags: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading('Submitting your job post...');

    try {
      // Split tags string into an array, trim whitespace, and remove empty strings
      const tagsArray = formState.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      const response = await fetch('/api/jobs/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formState,
          tags: tagsArray,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Job posted successfully!', { id: loadingToast });
        setFormState({
          title: '',
          company: '',
          location: '',
          description: '',
          applyLink: '',
          posterEmail: '',
          salaryRange: '',
          tags: '',
        });
      } else {
        toast.error(data.message || 'Failed to post job.', { id: loadingToast });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('An unexpected error occurred.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Post a Job - AI Job Spot</title>
        <meta name="description" content="Feature your job listing and reach top AI talent." />
      </Head>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">Post a Job</h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500 dark:text-gray-400">Get your opportunity in front of the best AI talent in the industry.</p>
        </div>

        <div className="mt-12 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8 bg-gray-50 dark:bg-gray-900">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Job Details</h3>
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Title</label>
                <input type="text" name="title" id="title" value={formState.title} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-gold focus:ring-brand-gold sm:text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                <input type="text" name="company" id="company" value={formState.company} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-gold focus:ring-brand-gold sm:text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                <input type="text" name="location" id="location" value={formState.location} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-gold focus:ring-brand-gold sm:text-sm dark:bg-gray-700 dark:text-white" />
              </div>
               <div>
                <label htmlFor="salaryRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Salary Range (Optional)</label>
                <input type="text" name="salaryRange" id="salaryRange" value={formState.salaryRange} onChange={handleInputChange} placeholder="e.g., $120,000 - $150,000" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-gold focus:ring-brand-gold sm:text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Description (Supports HTML for formatting)</label>
                <textarea name="description" id="description" value={formState.description} onChange={handleInputChange} required rows={8} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-gold focus:ring-brand-gold sm:text-sm dark:bg-gray-700 dark:text-white"></textarea>
              </div>
              <div>
                <label htmlFor="applyLink" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Application Link or Email</label>
                <input type="text" name="applyLink" id="applyLink" value={formState.applyLink} onChange={handleInputChange} required placeholder="https://example.com/apply or jobs@example.com" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-gold focus:ring-brand-gold sm:text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags (Optional, comma-separated)</label>
                <input type="text" name="tags" id="tags" value={formState.tags} onChange={handleInputChange} placeholder="e.g., Machine Learning, NLP, Full-time" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-gold focus:ring-brand-gold sm:text-sm dark:bg-gray-700 dark:text-white" />
              </div>
               <div>
                <label htmlFor="posterEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Email (for confirmation, not public)</label>
                <input type="email" name="posterEmail" id="posterEmail" value={formState.posterEmail} onChange={handleInputChange} required placeholder="you@yourcompany.com" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-gold focus:ring-brand-gold sm:text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gold hover:bg-brand-gold-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Submitting...' : 'Post Job Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    <Toaster position="bottom-center" />
    </Layout>
  );
};

export default PostAJobPage;
