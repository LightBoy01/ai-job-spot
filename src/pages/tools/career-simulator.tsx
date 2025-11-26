import { useState } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import apiHandler, {
  CareerPathResponse,
} from '@/pages/api/tools/career-simulator';
import { NextApiRequest, NextApiResponse } from 'next';

interface CareerSimulatorPageProps {
  initialData: CareerPathResponse | null;
  initialRole: string;
  error?: string;
}

const CareerSimulatorPage: NextPage<CareerSimulatorPageProps> = ({
  initialData,
  initialRole,
  error: initialError,
}) => {
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [data, setData] = useState<CareerPathResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);

  const handleRoleChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const role = event.target.value;
    setSelectedRole(role);
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`/api/tools/career-simulator?role=${role}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Failed to fetch career path data.'
        );
      }
      const result = (await response.json()) as CareerPathResponse;
      setData(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderResult = () => {
    if (isLoading) {
      return <p className="text-center">Simulating your career path...</p>;
    }

    if (error) {
      return <p className="text-red-500 text-center">{error}</p>;
    }

    if (!data) {
      return (
        <p className="text-center text-gray-500">
          Select a role to see your potential career path.
        </p>
      );
    }

    return (
      <div className="space-y-8 mt-10">
        {data.nextSteps.map((step) => (
          <div
            key={step.role}
            className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border-l-4 border-primary-500"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Next Step: {step.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-2">Common Skills</h4>
                {step.commonSkills.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {step.commonSkills.map((skill) => (
                      <li key={skill} className="capitalize">
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    Not enough data to determine common skills.
                  </p>
                )}
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Relevant Jobs</h4>
                {step.relevantJobs.length > 0 ? (
                  <ul className="space-y-2">
                    {step.relevantJobs.map((job) => (
                      <li key={job.id}>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-primary-600 hover:underline"
                        >
                          {job.title} at {job.company}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No specific jobs found for this path right now.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <Head>
        <title>AI Career Trajectory Simulator | AI Job Spot</title>
        <meta
          name="description"
          content="Simulate your career trajectory in the AI industry. See common next steps, required skills, and relevant jobs based on your current role."
        />
      </Head>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            AI Career Trajectory Simulator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Select your current role to see a data-backed projection of your next
            steps, including common skills and relevant opportunities.
          </p>
        </div>

        {/* --- Controls --- */}
        <div className="mb-8 max-w-md mx-auto">
          <label
            htmlFor="role-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Your Current Role:
          </label>
          <select
            id="role-select"
            value={selectedRole}
            onChange={handleRoleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="ai_ml_engineer">AI / Machine Learning Engineer</option>
            <option value="data_scientist">Data Scientist</option>
            <option value="software_engineer">Software Engineer</option>
          </select>
        </div>

        {/* --- Results --- */}
        <div className="min-h-[20rem]">{renderResult()}</div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<
  CareerSimulatorPageProps
> = async () => {
  const initialRole = 'ai_ml_engineer';

  try {
    // We will call our own API route handler directly on the server.
    // This is more efficient than a network fetch.
    const req = {
      query: { role: initialRole },
      method: 'GET',
    } as unknown as NextApiRequest;

    let data: CareerPathResponse | { message: string } | null = null;
    let statusCode = 200;

    // A mock response object that the handler can write to.
    const res = {
      status: (code: number) => {
        statusCode = code;
        // Return a chainable object with a json method
        return {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          json: (body: any) => {
            data = body;
          },
          end: () => {
            /* no-op */
          },
        };
      },
      setHeader: () => {
        /* no-op */
      },
    } as unknown as NextApiResponse;

    await apiHandler(req, res);

    // Handle potential errors from the API handler
    if (statusCode !== 200 || !data) {
      throw new Error('Failed to fetch initial data from the API handler.');
    }

    // Check if the handler returned an error message
    if ('message' in data) {
      throw new Error((data as { message: string }).message);
    }

    // If we get here, the data is valid.
    return {
      props: {
        initialData: data,
        initialRole,
      },
    };
  } catch (error) {
    const err = error as Error;
    console.error('Error in getServerSideProps for simulator:', err.message);
    return {
      props: {
        initialData: null,
        initialRole,
        error: err.message || 'An unexpected error occurred.',
      },
    };
  }
};

export default CareerSimulatorPage;
