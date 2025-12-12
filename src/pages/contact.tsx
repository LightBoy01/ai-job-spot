import Layout from '../components/Layout';
import Head from 'next/head';
import React, { useState } from 'react';
import AdContainer from '@/components/AdContainer';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.details) {
          const details = Object.values(errorData.details).flat().join(' ');
          throw new Error(details);
        }
        throw new Error(errorData.error || 'Failed to send message.');
      }

      setSuccess('Your message has been sent successfully!');
      setFormData({
        name: '',
        email: '',
        message: '',
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Contact Us - AI Job Spot</title>
        <meta
          name="description"
          content="Get in touch with AI Job Spot. We'd love to hear from you!"
        />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-serif font-bold text-primary-dark mb-6">
          Contact Us
        </h1>
        <p className="text-lg text-neutral-800 mb-4">
          We&apos;d love to hear from you! Whether you have a question,
          feedback, or a partnership inquiry, please don&apos;t hesitate to
          reach out.
        </p>
        <div className="bg-neutral-100 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-serif font-semibold text-primary-dark mb-4">
            Send us a message
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-neutral-700 text-sm font-bold mb-2"
              >
                Name:
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-800 leading-tight bg-neutral-50"
                placeholder="Your Name"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-neutral-700 text-sm font-bold mb-2"
              >
                Email:
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-800 leading-tight bg-neutral-50"
                placeholder="your@example.com"
                required
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="message"
                className="block text-neutral-700 text-sm font-bold mb-2"
              >
                Message:
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-800 leading-tight bg-neutral-50"
                placeholder="Your message"
                required
              ></textarea>
            </div>
            {error && (
              <p className="text-red-500 text-center mb-4">Error: {error}</p>
            )}
            {success && (
              <p className="text-green-500 text-center mb-4">{success}</p>
            )}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-secondary hover:bg-secondary-dark text-primary-dark font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
          <p className="text-center text-neutral-600 text-sm mt-6">
            Alternatively, you can reach us directly at:{' '}
            <a
              href="mailto:contact@aijobspot.online"
              className="text-secondary-dark hover:underline"
            >
              contact@aijobspot.online
            </a>
          </p>
        </div>
        <div className="mt-8">
            <AdContainer slot={process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT || ''} />
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
