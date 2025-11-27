import { GithubAuthProvider, signInWithPopup } from 'firebase/auth';
import Head from 'next/head';
import React, { useState } from 'react';

import type { DeveloperDnaReport } from '@/lib/analysis/engine';

import Layout from '@/components/Layout';
import useAuth from '@/hooks/useAuth';

import { auth } from '../lib/firebase';

// --- Sub-components for rendering the report ---
const ProfileSection = ({ profile }: { profile: DeveloperDnaReport['profile'] }) => (
    <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm mb-8">
        <div className="flex items-center">
            <img alt={profile.login} className="w-24 h-24 rounded-full mr-6 border-2 border-neutral-300" src={profile.avatar_url} />
            <div>
                <h3 className="text-2xl font-bold font-sans">{profile.name || profile.login}</h3>
                <p className="text-neutral-600 font-serif">{profile.bio}</p>
                <div className="flex space-x-4 mt-2 text-sm text-neutral-500">
                    <span>{profile.followers} followers</span>
                    <span>{profile.following} following</span>
                    <span>{profile.public_repos} public repos</span>
                </div>
            </div>
        </div>
    </div>
);

const LanguageSection = ({ languages }: { languages: DeveloperDnaReport['stats']['languageBreakdown'] }) => (
    <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
        <h4 className="text-xl font-bold font-sans mb-4">Language Breakdown</h4>
        <ul className="space-y-2">
            {Object.entries(languages).sort(([, a], [, b]) => b - a).map(([lang, count]) => (
                <li className="flex justify-between items-center font-mono text-sm" key={lang}>
                    <span>{lang}</span>
                    <span className="font-sans text-neutral-500">{count} {count > 1 ? 'repos' : 'repo'}</span>
                </li>
            ))}
        </ul>
    </div>
);

const CommitActivitySection = ({ activity }: { activity: DeveloperDnaReport['stats']['commitActivity'] }) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const maxCommits = Math.max(...activity.byDay);
    return (
        <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
            <h4 className="text-xl font-bold font-sans mb-4">Commit Activity by Day</h4>
            <div className="flex justify-between items-end h-32 space-x-2">
                {activity.byDay.map((count, i) => (
                    <div className="flex-1 flex flex-col items-center" key={i}>
                        <div
                            className="w-full bg-primary-blue"
                            style={{ height: `${maxCommits > 0 ? (count / maxCommits) * 100 : 0}%` }}
                            title={`${count} commits`}
                        />
                        <span className="text-xs text-neutral-500 mt-1">{days[i]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const DashboardPage = () => {
    const { loading: authLoading, user } = useAuth();
    const [isGitHubConnected, setIsGitHubConnected] = useState(false); // Assume not connected initially
    const [connectError, setConnectError] = useState<null | string>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const [report, setReport] = useState<DeveloperDnaReport | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportError, setReportError] = useState<null | string>(null);

    // In a real app, you'd check on load if the user has an existing integration
    // useEffect(() => { ... check if connection exists ... }, [user]);

    const handleGitHubConnect = async () => {
        if (!user) {
            setConnectError('You must be logged in to connect your GitHub account.');
            return;
        }
        setIsConnecting(true);
        setConnectError(null);
        try {
            const provider = new GithubAuthProvider();
            provider.addScope('repo');
            const result = await signInWithPopup(auth, provider);
            const credential = GithubAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;

            if (token) {
                const idToken = await user.getIdToken();
                const response = await fetch('/api/integrations/github/connect', {
                    body: JSON.stringify({ token }),
                    headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                    method: 'POST',
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to connect GitHub account.');
                }
                setIsGitHubConnected(true);
                alert('Successfully and securely connected your GitHub account!');
            } else {
                throw new Error('Could not retrieve GitHub access token.');
            }
        } catch (error: unknown) {
            console.error('Error connecting GitHub account:', error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            setConnectError(message);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleGenerateReport = async () => {
        if (!user) {
            setReportError('You must be logged in to generate a report.');
            return;
        }
        setIsGenerating(true);
        setReportError(null);
        setReport(null);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/analysis/github', {
                headers: { 'Authorization': `Bearer ${idToken}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate report.');
            }
            // TODO: Define a strong type for the analysis report
            const reportData = await response.json() as DeveloperDnaReport;
            setReport(reportData);
        } catch (error: unknown) {
            console.error('Error generating report:', error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            setReportError(message);
        } finally {
            setIsGenerating(false);
        }
    };
    

    if (authLoading) return <Layout><div className="text-center p-12">Loading user...</div></Layout>;
    if (!user) return <Layout><div className="text-center p-12">Please log in to view your dashboard.</div></Layout>;

    return (
        <Layout>
            <Head>
                <title>Your Dashboard | AI Job Spot</title>
                <meta content="noindex, nofollow" name="robots" />
            </Head>

            <div className="max-w-6xl mx-auto px-4 py-12">
                <header className="mb-12">
                    <h1 className="page-title text-4xl sm:text-5xl">Your Career Analytics</h1>
                    <p className="mt-4 text-lg text-neutral-600 font-serif">
                        A private, data-driven analysis of your skills and work patterns.
                    </p>
                </header>

                {!isGitHubConnected && (
                    <section>
                        <h2 className="text-2xl font-bold font-sans text-neutral-800 border-b pb-3 mb-6">Connect Your Accounts</h2>
                        <div className="bg-white p-8 rounded-lg border border-neutral-200 shadow-sm">
                            <div className="flex flex-col items-center">
                                <button className="bg-neutral-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-neutral-900 disabled:bg-neutral-400 transition-colors" disabled={isConnecting} onClick={handleGitHubConnect}>
                                    {isConnecting ? 'Connecting...' : 'Connect GitHub Account'}
                                </button>
                                {connectError && <p className="text-red-500 mt-4">{connectError}</p>}
                                <p className="text-center text-neutral-500 font-serif mt-4 text-sm">
                                    You&apos;ll be prompted to authorize read-access to your repository metadata. We will not access your code.
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {isGitHubConnected && !report && (
                     <section className="text-center">
                        <h2 className="text-2xl font-bold font-sans text-green-700 mb-4">GitHub Connected!</h2>
                        <button className="bg-primary-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors" disabled={isGenerating} onClick={handleGenerateReport}>
                            {isGenerating ? 'Generating Your DNA Report...' : 'Generate My Developer DNA'}
                        </button>
                        {reportError && <p className="text-red-500 mt-4">{reportError}</p>}
                    </section>
                )}
                
                {isGenerating && <div className="text-center p-12 font-serif text-neutral-600">Analyzing your repositories... this may take a moment.</div>}

                {report && (
                    <section>
                        <ProfileSection profile={report.profile} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <LanguageSection languages={report.stats.languageBreakdown} />
                            <CommitActivitySection activity={report.stats.commitActivity} />
                        </div>
                         <div className="text-center mt-8 text-sm text-neutral-400 font-sans">
                            Analyzed {report.stats.totalCommitsAnalyzed} commits across {report.stats.totalReposAnalyzed} repositories.
                        </div>
                    </section>
                )}
            </div>
        </Layout>
    );
};

export default DashboardPage;
