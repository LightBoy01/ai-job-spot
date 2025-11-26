
import React, { useState } from 'react';

const ZeroResults: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual subscription logic to an API endpoint
    console.log(`Subscribing ${email} to job alerts.`);
    setSubscribed(true);
  };

  return (
    <div className="text-center bg-neutral-50/70 p-8 sm:p-12 rounded-lg shadow-inner border border-neutral-200/80 my-8">
      <h3 className="text-2xl font-bold text-neutral-800 mb-4 font-serif">No Jobs Found</h3>
      <p className="text-neutral-600 mb-6 max-w-md mx-auto">
        We couldn&apos;t find any jobs matching this specific category right now. New jobs are added daily.
      </p>

      {subscribed ? (
        <p className="text-green-600 font-semibold">Thank you for subscribing! We&apos;ll keep you updated.</p>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-sm mx-auto">
          <label htmlFor="email-alert" className="block text-sm font-medium text-neutral-700 mb-2">Get notified when new jobs are posted:</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              id="email-alert"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="w-full p-3 border border-neutral-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary"
            />
            <button type="submit" className="bg-primary text-white font-bold py-3 px-6 rounded-md hover:bg-primary-dark transition-colors duration-300 whitespace-nowrap">
              Get Job Alerts
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ZeroResults;
