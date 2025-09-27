import React, { useState } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import AdminLayout from '@/components/AdminLayout';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { SerializedPipelineRunLog } from '@/lib/types';
import { format } from 'date-fns';

interface PipelineStatusPageProps {
  pipelineRuns: SerializedPipelineRunLog[];
}

const PipelineStatusPage: NextPage<PipelineStatusPageProps> = ({ pipelineRuns }) => {
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const toggleExpand = (runId: string) => {
    setExpandedRunId(expandedRunId === runId ? null : runId);
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pipeline Status Dashboard</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Run ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feeds Processed</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Added</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Errors</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pipelineRuns.map((run) => (
              <React.Fragment key={run.runId}>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{run.runId.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(run.timestamp), 'PPP p')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold 
                    ${run.status === 'Success' ? 'text-green-600' : 
                    run.status === 'Partial Success' ? 'text-yellow-600' : 'text-red-600'}
                  ">
                    {run.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{run.feedsProcessed}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{run.itemsAdded}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{run.errors.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {run.errors.length > 0 && (
                      <button 
                        onClick={() => toggleExpand(run.runId)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {expandedRunId === run.runId ? 'Hide' : 'View'} Errors
                      </button>
                    )}
                  </td>
                </tr>
                {expandedRunId === run.runId && run.errors.length > 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 bg-gray-50">
                      <div className="text-sm text-red-700">
                        <h4 className="font-semibold mb-2">Errors for Run ID: {run.runId.substring(0, 8)}...</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {run.errors.map((error, index) => (
                            <li key={index}>
                              <strong>Source:</strong> {error.source} - <strong>Error:</strong> {error.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<PipelineStatusPageProps> = async () => {
  try {
    const { adminDb } = await getFirebaseAdmin();
    const pipelineRunsSnapshot = await adminDb.collection('pipeline_runs').orderBy('timestamp', 'desc').get();
    const pipelineRuns: SerializedPipelineRunLog[] = pipelineRunsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        runId: data.runId,
        status: data.status,
        feedsProcessed: data.feedsProcessed,
        itemsAdded: data.itemsAdded,
        errors: data.errors || [],
        timestamp: data.timestamp.toDate().toISOString(),
      };
    });

    return {
      props: {
        pipelineRuns,
      },
    };
  } catch (error) {
    console.error('Error fetching pipeline runs:', error);
    return {
      props: {
        pipelineRuns: [],
      },
    };
  }
};

export default PipelineStatusPage;
