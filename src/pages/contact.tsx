import Layout from '../components/Layout';
import Head from 'next/head';
import React, { useState } from 'react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        <meta name="description" content="Get in touch with AI Job Spot. We&apos;d love to hear from you!" />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-brand-gold mb-6">Contact Us</h1>
        <p className="text-lg text-brand-beige mb-4">
          We&apos;d love to hear from you! Whether you have a question, feedback, or a partnership inquiry, please don&apos;t hesitate to reach out.
        </p>
        <div className="bg-brand-dark-blue p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-brand-gold mb-4">Send us a message</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-brand-beige text-sm font-bold mb-2">Name:</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-brand-charcoal leading-tight focus:outline-none focus:shadow-outline bg-brand-gray" placeholder="Your Name" required />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-brand-beige text-sm font-bold mb-2">Email:</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-brand-charcoal leading-tight focus:outline-none focus:shadow-outline bg-brand-gray" placeholder="your@example.com" required />
            </div>
            <div className="mb-6">
              <label htmlFor="message" className="block text-brand-beige text-sm font-bold mb-2">Message:</label>
              <textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={5} className="shadow appearance-none border rounded w-full py-2 px-3 text-brand-charcoal leading-tight focus:outline-none focus:shadow-outline bg-brand-gray" placeholder="Your message" required></textarea>
            </div>
            {error && <p className="text-red-500 text-center mb-4">Error: {error}</p>}
            {success && <p className="text-green-500 text-center mb-4">{success}</p>}
            <div className="flex items-center justify-between">
              <button type="submit" className="bg-brand-gold hover:bg-opacity-90 text-brand-charcoal font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
          <p className="text-center text-brand-gray text-sm mt-6">
            Alternatively, you can reach us directly at: <a href="mailto:contact@aijobspot.com" className="text-brand-light-blue hover:underline">contact@aijobspot.com</a>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
