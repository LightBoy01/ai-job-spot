import { useState } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import apiHandler, {
  CareerPathResponse,
} from '@/pages/api/tools/career-simulator';
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
        <div className="flex flex-col items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-lg text-neutral-600 font-serif italic">Analyzing career pathways...</p>
        </div>
      )
    }

    if (error) {
      return <p className="text-red-500 text-center p-10 bg-red-50 rounded-lg border border-red-100">{error}</p>;
    }

    if (!data) {
      return (
        <div className="text-center p-16 bg-neutral-50/50 rounded-xl border border-neutral-200/60 dashed-border">
            <h3 className="text-2xl font-serif text-primary-dark mb-2">Your Future Awaits</h3>
            <p className="text-neutral-500">
            Select a role above to reveal your potential career trajectory.
            </p>
        </div>
      );
    }

    return (
      <div className="mt-12">
        <div className="relative border-l-2 border-primary/20 pl-8 ml-4 md:ml-10 space-y-16">
            {/* Origin Point */}
            <div className="relative">
                <div className="absolute -left-[2.9rem] top-1 w-10 h-10 bg-primary-dark rounded-full border-4 border-white shadow-md flex items-center justify-center z-10">
                    <span className="text-white font-bold text-sm">1</span>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
                    <h2 className="text-2xl font-serif font-bold text-primary-dark">Current Role: {data.currentRole.title}</h2>
                    <p className="text-neutral-500 mt-1">Starting Point</p>
                </div>
            </div>

            {/* Next Steps */}
            {data.nextSteps.map((step, index) => (
            <div key={step.role} className="relative">
                <div className="absolute -left-[2.9rem] top-1 w-10 h-10 bg-secondary rounded-full border-4 border-white shadow-md flex items-center justify-center z-10">
                    <span className="text-white font-bold text-sm">{index + 2}</span>
                </div>
                
                {/* Connector Line Cover for last item to stop line going down */}
                {index === data.nextSteps.length - 1 && (
                    <div className="absolute -left-[2.1rem] top-10 bottom-0 w-1 bg-white z-0 h-full"></div>
                )}

                <div className="bg-white shadow-xl shadow-neutral-100/50 rounded-xl p-8 border border-neutral-200/60 transition-all duration-300 hover:border-secondary/30 hover:shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                         <h3 className="text-2xl sm:text-3xl font-serif font-bold text-secondary-dark">
                            Next Step: {step.title}
                        </h3>
                        <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full mt-2 md:mt-0 w-fit">
                            Recommended Path
                        </span>
                    </div>
                   
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <div>
                            <h4 className="text-lg font-semibold mb-4 flex items-center text-primary-dark border-b border-neutral-100 pb-2">
                                <svg className="w-5 h-5 mr-2 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Key Skills to Acquire
                            </h4>
                            {step.commonSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {step.commonSkills.map((skill) => (
                                <span key={skill} className="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-md border border-neutral-200">
                                    {skill}
                                </span>
                                ))}
                            </div>
                            ) : (
                            <p className="text-sm text-neutral-500 italic">
                                Data gathering in progress for this role.
                            </p>
                            )}
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4 flex items-center text-primary-dark border-b border-neutral-100 pb-2">
                                <svg className="w-5 h-5 mr-2 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                Open Opportunities
                            </h4>
                            {step.relevantJobs.length > 0 ? (
                            <ul className="space-y-3">
                                {step.relevantJobs.map((job) => (
                                <li key={job.id}>
                                    <Link
                                    href={`/jobs/${job.id}`}
                                    className="group block p-3 bg-neutral-50 hover:bg-white border border-transparent hover:border-secondary/20 rounded-lg transition-colors"
                                    >
                                    <div className="font-semibold text-primary group-hover:text-secondary-dark transition-colors">{job.title}</div>
                                    <div className="text-sm text-neutral-500">{job.company} • {job.location}</div>
                                    </Link>
                                </li>
                                ))}
                            </ul>
                            ) : (
                            <p className="text-sm text-neutral-500 italic">
                                No specific openings matching this exact title right now.
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
    // 1. Fetch the list of valid roles from the simulator API itself
    const rolesReq = { query: { listRoles: 'true' }, method: 'GET' } as unknown as NextApiRequest;
    const rolesRes = createMockRes();
    await apiHandler(rolesReq, rolesRes);
    const { statusCode: rolesStatus, data: rolesData } = rolesRes._getData();
    
    const typedRolesData = rolesData as { roles: Role[] };
    if (rolesStatus !== 200 || !typedRolesData?.roles) {
      throw new Error('Failed to fetch simulator roles.');
    }
    const initialRoles = typedRolesData.roles;
    const initialRole = initialRoles[0]?.key || 'software_engineer';

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
        initialRole: 'software_engineer',
        initialRoles: [],
        error: err.message || 'An unexpected error occurred.',
      },
    };
  }
};

export default CareerSimulatorPage;
