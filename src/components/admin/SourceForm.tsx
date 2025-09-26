import React, { useState, useEffect } from 'react';
import { SerializedSource } from '@/lib/types';

interface SourceFormProps {
  csrfToken: string;
  currentSource: SerializedSource | null;
  onSave: () => void;
  onCancel: () => void;
}

const SourceForm: React.FC<SourceFormProps> = ({
  csrfToken,
  currentSource,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Omit<SerializedSource, 'id'> | SerializedSource>(() =>
    currentSource
      ? currentSource
      : {
          status: 'Pending',
          type: 'Article',
          adapter: 'RSS',
          sourceName: '',
          feedUrl: '',
          notes: '',
          keywords: '',
        }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentSource) {
      setFormData(currentSource);
    } else {
      setFormData({
        status: 'Pending',
        type: 'Article',
        adapter: 'RSS',
        sourceName: '',
        feedUrl: '',
        notes: '',
        keywords: '',
      });
    }
  }, [currentSource]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const method = currentSource ? 'PUT' : 'POST';
      const url = currentSource
        ? `/api/admin/sources/${currentSource.id}`
        : '/api/admin/sources';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save source');
      }

      onSave(); // Refresh data in parent component
      onCancel(); // Close modal
    } catch (err) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label htmlFor="sourceName" className="block text-sm font-medium text-gray-700">Source Name</label>
        <input
          type="text"
          name="sourceName"
          id="sourceName"
          value={formData.sourceName}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="feedUrl" className="block text-sm font-medium text-gray-700">Feed URL</label>
        <input
          type="url"
          name="feedUrl"
          id="feedUrl"
          value={formData.feedUrl}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
        <select
          name="type"
          id="type"
          value={formData.type}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="Article">Article</option>
          <option value="Job">Job</option>
        </select>
      </div>

      <div>
        <label htmlFor="adapter" className="block text-sm font-medium text-gray-700">Adapter</label>
        <select
          name="adapter"
          id="adapter"
          value={formData.adapter}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="RSS">RSS</option>
          <option value="RSS_HUB">RSS_HUB</option>
          <option value="HIRING_CAFE">HIRING_CAFE</option>
          <option value="HIRING_CAFE_API">HIRING_CAFE_API</option>
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
        <select
          name="status"
          id="status"
          value={formData.status}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="Pending">Pending</option>
          <option value="Integrated">Integrated</option>
          <option value="Failing">Failing</option>
        </select>
      </div>

      <div>
        <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">Keywords (for API adapters)</label>
        <input
          type="text"
          name="keywords"
          id="keywords"
          value={formData.keywords}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          name="notes"
          id="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          disabled={loading || !csrfToken}
        >
          {loading ? 'Saving...' : 'Save Source'}
        </button>
      </div>
    </form>
  );
};

export default SourceForm;
