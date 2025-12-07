import { useState } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import apiHandler, {
  CareerPathResponse,
} from '@/pages/api/tools/career-simulator';
import commonRolesApiHandler from '@/pages/api/jobs/common-roles';
import { NextApiRequest, NextApiResponse } from 'next';

type Role = { key: string; title: string };

interface CareerSimulatorPageProps {
  initialData: CareerPathResponse | null;
  initialRole: string;
  initialRoles: Role[];
  error?: string;
}

const CareerSimulatorPage: NextPage<CareerSimulatorPageProps> = ({
  initialData,
  initialRole,
  initialRoles,
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
      return (
        <div className="text-center p-10">
            <p className="text-lg text-neutral-600">Simulating your career path...</p>
            {/* You can add a spinner here */}
        </div>
      )
    }

    if (error) {
      return <p className="text-red-500 text-center">{error}</p>;
    }

    if (!data) {
      return (
        <div className="text-center p-10 bg-neutral-50 rounded-lg">
            <h3 className="text-xl font-semibold text-neutral-700">Your Future Awaits</h3>
            <p className="mt-2 text-neutral-500">
            Select a role to see your potential career path.
            </p>
        </div>
      );
    }

    return (
      <div className="mt-12">
        <div className="relative border-l-2 border-primary/20 pl-8">
            {/* Current Role Marker */}
            <div className="mb-12 relative">
                <div className="absolute -left-[3.2rem] top-1 w-8 h-8 bg-primary rounded-full border-4 border-white flex items-center justify-center">
                    <span className="text-white font-bold">1</span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-primary-dark">Current Role: {data.currentRole.title}</h2>
                <p className="text-neutral-500">This is your starting point.</p>
            </div>

            {/* Next Steps */}
            {data.nextSteps.map((step, index) => (
            <div key={step.role} className="mb-12 relative">
                <div className="absolute -left-[3.2rem] top-1 w-8 h-8 bg-secondary rounded-full border-4 border-white flex items-center justify-center">
                    <span className="text-white font-bold">{index + 2}</span>
                </div>
                <div className="bg-white shadow-lg rounded-lg p-6 border border-neutral-200/80">
                    <h3 className="text-2xl font-serif font-bold text-secondary-dark mb-4">
                        Next Step: {step.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div>
                            <h4 className="text-lg font-semibold mb-3 flex items-center text-neutral-800">
                                <svg className="w-5 h-5 mr-2 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                                Common Skills
                            </h4>
                            {step.commonSkills.length > 0 ? (
                            <ul className="space-y-2">
                                {step.commonSkills.map((skill) => (
                                <li key={skill} className="capitalize bg-secondary/10 text-secondary-dark px-3 py-1 rounded-md text-sm font-medium inline-block mr-2 mb-2">
                                    {skill}
                                </li>
                                ))}
                            </ul>
                            ) : (
                            <p className="text-sm text-neutral-500">
                                Not enough data to determine common skills.
                            </p>
                            )}
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-3 flex items-center text-neutral-800">
                                <svg className="w-5 h-5 mr-2 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                Relevant Jobs
                            </h4>
                            {step.relevantJobs.length > 0 ? (
                            <ul className="space-y-3">
                                {step.relevantJobs.map((job) => (
                                <li key={job.id}>
                                    <Link
                                    href={`/jobs/${job.id}`}
                                    className="group"
                                    >
                                    <span className="font-semibold text-primary group-hover:underline">{job.title}</span>
                                    <span className="text-neutral-500"> at {job.company}</span>
                                    </Link>
                                </li>
                                ))}
                            </ul>
                            ) : (
                            <p className="text-sm text-neutral-500">
                                No specific jobs found for this path right now.
                            </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            ))}
        </div>
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
            {initialRoles.map((role) => (
              <option key={role.key} value={role.key}>{role.title}</option>
            ))}
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
  // Mock response object for calling API handlers
  const createMockRes = () => {
    let data: unknown = null;
    let statusCode = 200;
    const res = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (body: unknown) => { data = body; },
          end: () => {},
        };
      },
      setHeader: () => {},
      _getData: () => ({ statusCode, data }),
    } as unknown as NextApiResponse & { _getData: () => { statusCode: number, data: unknown } };
    return res;
  };

  try {
    // 1. Fetch the list of common roles
    const rolesReq = { method: 'GET' } as NextApiRequest;
    const rolesRes = createMockRes();
    await commonRolesApiHandler(rolesReq, rolesRes);
    const { statusCode: rolesStatus, data: rolesData } = rolesRes._getData();
    
    const typedRolesData = rolesData as { roles: Role[] };
    if (rolesStatus !== 200 || !typedRolesData?.roles) {
      throw new Error('Failed to fetch common roles.');
    }
    const initialRoles = typedRolesData.roles;
    const initialRole = initialRoles[0]?.key || 'ai_ml_engineer';

    // 2. Fetch the initial career path data for the first role
    const careerReq = { query: { role: initialRole }, method: 'GET' } as unknown as NextApiRequest;
    const careerRes = createMockRes();
    await apiHandler(careerReq, careerRes);
    const { statusCode: careerStatus, data: careerData } = careerRes._getData();

    if (careerStatus !== 200) {
       throw new Error((careerData as { message: string })?.message || 'Failed to fetch initial career path.');
    }

    return {
      props: {
        initialData: careerData as CareerPathResponse,
        initialRole,
        initialRoles,
      },
    };

  } catch (error) {
    const err = error as Error;
    console.error('Error in getServerSideProps for simulator:', err.message);
    return {
      props: {
        initialData: null,
        initialRole: 'ai_ml_engineer',
        initialRoles: [],
        error: err.message || 'An unexpected error occurred.',
      },
    };
  }
};

export default CareerSimulatorPage;
