import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Head from 'next/head';

export default function SharePage() {
  const [tag, setTag] = useState('');
  const [limit, setLimit] = useState(5);
  const [theme, setTheme] = useState('light');

  const generateCode = () => {
    return `<!-- AI Job Spot Widget -->
<div id="ai-job-spot-widget" 
     data-limit="${limit}" 
     data-theme="${theme}" 
     ${tag ? `data-tag="${tag}"` : ''}></div>
<script src="https://aijobspot.online/widget.js" async></script>`;
  };

  return (
    <Layout>
      <Head>
        <title>Share AI Jobs - Widget & API | AI Job Spot</title>
        <meta name="description" content="Embed curated AI job listings on your website for free. Use our widget or API to provide value to your audience." />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-dark mb-4">
            The Decentralized Referral Engine
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Transform your website into a resource hub. Embed our live, curated AI job data for free.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Configuration */}
          <div>
            <h2 className="text-2xl font-serif font-semibold text-primary-dark mb-6">
              1. Configure Your Widget
            </h2>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200 space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 font-serif">Filter by Tag (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Machine Learning, Python, Remote"
                  className="w-full p-2 border border-neutral-300 rounded-sm focus:ring-1 focus:ring-secondary focus:border-secondary transition-colors"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                />
                <p className="text-xs text-neutral-500 mt-1 italic">Leave empty to show all AI jobs.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 font-serif">Number of Jobs</label>
                <select 
                  className="w-full p-2 border border-neutral-300 rounded-sm focus:ring-1 focus:ring-secondary focus:border-secondary transition-colors"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                >
                  <option value="3">3 Jobs</option>
                  <option value="5">5 Jobs</option>
                  <option value="10">10 Jobs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 font-serif">Theme</label>
                <select 
                  className="w-full p-2 border border-neutral-300 rounded-sm focus:ring-1 focus:ring-secondary focus:border-secondary transition-colors"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>

            </div>
          </div>

          {/* Preview & Code */}
          <div>
            <h2 className="text-2xl font-serif font-semibold text-primary-dark mb-6">
              2. Preview & Copy Code
            </h2>
            
            <div className="mb-6">
               {/* We simulate the widget here for preview */}
               <div className={`border rounded-lg overflow-hidden shadow-md ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`}>
                 <div className="bg-[#1A2B4C] text-white px-4 py-3 font-semibold text-base flex justify-between items-center border-b-2 border-[#D4AF37]">
                   <span className="font-serif tracking-wide">AI Jobs Preview</span>
                 </div>
                 <div className={`p-4 text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                   (Widget will load here on your site)
                   <br/>
                   Displaying {limit} jobs
                   {tag && ` for "${tag}"`}
                 </div>
                 <div className={`px-4 py-2 text-center text-xs border-t ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} font-serif`}>
                   Powered by <span className="text-[#D4AF37] font-semibold">AI Job Spot</span>
                 </div>
               </div>
            </div>

            <div className="relative">
              <pre className="bg-neutral-800 text-neutral-100 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                {generateCode()}
              </pre>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(generateCode())
                    .then(() => alert('Code copied to clipboard!'))
                    .catch(() => alert('Failed to copy code. Please manually select and copy.'));
                }}
                className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-xs transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="mt-20 border-t border-neutral-200 pt-12">
          <h2 className="text-3xl font-serif font-bold text-primary-dark mb-6 text-center">
            For Developers (API Access)
          </h2>
          <div className="bg-neutral-50 p-8 rounded-lg border border-neutral-200 prose prose-lg max-w-none">
            <p>
              Building a custom dashboard? Use our free JSON API.
            </p>
            <ul>
              <li><strong>Endpoint:</strong> <code className="break-all">https://aijobspot.online/api/public/jobs</code></li>
              <li><strong>Method:</strong> <code>GET</code></li>
              <li><strong>Parameters:</strong> <code>limit</code> (max 20), <code>tag</code> (optional)</li>
            </ul>
            <p className="text-sm italic text-neutral-600">
              * By using this API, you agree to include a visible "Powered by AI Job Spot" link on your application.
            </p>
          </div>
        </div>

      </div>
    </Layout>
  );
}
