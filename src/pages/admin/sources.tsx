import React, { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import AdminLayout from '@/components/AdminLayout';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { SerializedSource } from '@/lib/types';
import ConfirmationModal from '@/components/ConfirmationModal';
import SourceForm from '@/components/admin/SourceForm';
import toast from 'react-hot-toast';

interface SourcesPageProps {
  sources: SerializedSource[];
}

const SourcesPage: NextPage<SourcesPageProps> = ({ sources: initialSources }) => {
  const [sources, setSources] = useState<SerializedSource[]>(initialSources);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [currentSource, setCurrentSource] = useState<SerializedSource | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sourceToDeleteId, setSourceToDeleteId] = useState<string | null>(null);
  const [isTriggeringPipeline, setIsTriggeringPipeline] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch('/api/csrf');
        const { csrfToken } = await res.json();
        setCsrfToken(csrfToken);
      } catch (error) {
        console.error('Failed to fetch CSRF token', error);
      }
    };
    fetchCsrfToken();
  }, []);

  const refreshData = async () => {
    const res = await fetch('/api/admin/sources');
    const newSources = await res.json();
    setSources(newSources);
  };

  const handleAddSource = () => {
    setCurrentSource(null);
    setIsAddEditModalOpen(true);
  };

  const handleEditSource = (source: SerializedSource) => {
    setCurrentSource(source);
    setIsAddEditModalOpen(true);
  };

  const handleDeleteSource = (id: string) => {
    setSourceToDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (sourceToDeleteId) {
      const promise = fetch(`/api/admin/sources/${sourceToDeleteId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }).then(async (res) => {
        if (res.ok) {
          refreshData();
          return 'Source deleted successfully!';
        } else {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to delete source');
        }
      });

      toast.promise(promise, {
        loading: 'Deleting source...',
        success: (message) => message,
        error: (err) => `Error: ${err.message}`,
      });
    }
    closeModals();
  };

  const handleTriggerPipeline = async () => {
    setIsTriggeringPipeline(true);

    const promise = fetch('/api/admin/pipeline/trigger', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
      },
    }).then(async (res) => {
      if (res.ok) {
        // Don't reload immediately, let the user see the success message.
        // The pipeline runs in the background.
        return 'Pipeline trigger initiated successfully! Check status page for updates.';
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to trigger pipeline');
      }
    });

    toast.promise(promise, {
      loading: 'Triggering pipeline...',
      success: (message) => message,
      error: (err) => `Error: ${err.message}`,
    }).finally(() => {
        setIsTriggeringPipeline(false);
    });
  };

  const closeModals = () => {
    setIsAddEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setCurrentSource(null);
    setSourceToDeleteId(null);
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Content Sources</h1>
      
      <div className="mb-6 flex space-x-4">
        <button 
          onClick={handleAddSource}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add New Source
        </button>
        <button 
          onClick={handleTriggerPipeline}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          disabled={isTriggeringPipeline}
        >
          {isTriggeringPipeline ? 'Triggering...' : 'Trigger Pipeline'}
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adapter</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feed URL</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sources.map((source) => (
              <tr key={source.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{source.sourceName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{source.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{source.adapter}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{source.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                  <a href={source.feedUrl} target="_blank" rel="noopener noreferrer">{source.feedUrl}</a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => handleEditSource(source)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteSource(source.id!)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAddEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">{currentSource ? 'Edit Source' : 'Add New Source'}</h2>
            <SourceForm 
              csrfToken={csrfToken}
              currentSource={currentSource}
              onSave={refreshData}
              onCancel={closeModals}
            />
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this source? This action cannot be undone."
        confirmText="Delete"
        confirmButtonClassName="bg-red-600 hover:bg-red-700"
      />
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<SourcesPageProps> = async () => {
  try {
    const { adminDb } = await getFirebaseAdmin();
    const sourcesSnapshot = await adminDb.collection('sources').get();
    const sources = sourcesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        sourceName: data.sourceName ?? null,
        feedUrl: data.feedUrl ?? null,
        type: data.type ?? null,
        adapter: data.adapter ?? null,
        status: data.status ?? null,
        keywords: data.keywords ?? null,
        fetchFrequency: data.fetchFrequency ?? null,
        notes: data.notes ?? null,
        lastFetchedAt: data.lastFetchedAt?.toDate().toISOString() ?? null,
      };
    }) as SerializedSource[];

    return {
      props: {
        sources,
      },
    };
  } catch (error) {
    console.error('Error fetching sources:', error);
    return {
      props: {
        sources: [],
      },
    };
  }
};

export default SourcesPage;
