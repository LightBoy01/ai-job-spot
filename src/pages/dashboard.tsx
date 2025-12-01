import { GithubAuthProvider, signInWithPopup } from 'firebase/auth';
import Head from 'next/head';
import React, { useState } from 'react';

import type { VerifiedClaim } from '@/lib/verification/types';

import Layout from '@/components/Layout';
import useAuth from '@/hooks/useAuth';

import { auth } from '../lib/firebase';




const DashboardPage = () => {
    const { loading: authLoading, user } = useAuth();
    const [isGitHubConnected, setIsGitHubConnected] = useState(false); // Assume not connected initially
    const [connectError, setConnectError] = useState<null | string>(null);
    const [isConnecting, setIsConnecting] = useState(false);



    // In a real app, you'd check on load if the user has an existing integration
    // useEffect(() => { ... check if connection exists ... }, [user]);

    const [verificationResults, setVerificationResults] = useState<VerifiedClaim[] | null>(null);

    const handleVerifySkills = async () => {
        if (!user) {
            setConnectError('You must be logged in to verify your skills.');
            return;
        }
        setIsConnecting(true);
        setConnectError(null);
        setVerificationResults(null);

        try {
            const provider = new GithubAuthProvider();
            provider.addScope('repo'); // Needs repo scope to see private repos if we want to support that later, but public is fine for MVP
            const result = await signInWithPopup(auth, provider);
            const credential = GithubAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;

            if (token) {
                const idToken = await user.getIdToken();
                // Call the new Verification API
                const response = await fetch('/api/integrations/github/verify', {
                    body: JSON.stringify({ token, userId: user.uid }),
                    headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                    method: 'POST',
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to verify GitHub portfolio.');
                }

                const data = await response.json();
                setVerificationResults(data.claims);
                setIsGitHubConnected(true);
                alert(`Verification Complete! Found ${data.claims.length} verifiable claims.`);
            } else {
                throw new Error('Could not retrieve GitHub access token.');
            }
        } catch (error: unknown) {
            console.error('Error verifying GitHub account:', error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            setConnectError(message);
        } finally {
            setIsConnecting(false);
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

                {!verificationResults && (
                    <section>
                        <h2 className="text-2xl font-bold font-sans text-neutral-800 border-b pb-3 mb-6">Verify Your AI Skills</h2>
                        <div className="bg-white p-8 rounded-lg border border-neutral-200 shadow-sm">
                            <div className="flex flex-col items-center">
                                <button 
                                    className="bg-neutral-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-neutral-900 disabled:bg-neutral-400 transition-colors flex items-center" 
                                    disabled={isConnecting} 
                                    onClick={handleVerifySkills}
                                >
                                    <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                    </svg>
                                    {isConnecting ? 'Verifying...' : 'Verify with GitHub'}
                                </button>
                                {connectError && <p className="text-red-500 mt-4">{connectError}</p>}
                                <p className="text-center text-neutral-500 font-serif mt-4 text-sm max-w-md">
                                    We analyze your <strong>public</strong> repositories to verify your AI engineering contributions. 
                                    We calculate a cryptographic proof of your work without storing your code.
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {verificationResults && (
                    <section>
                        <h2 className="text-2xl font-bold font-sans text-green-700 mb-4 flex items-center">
                            <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Verification Successful
                        </h2>
                        <div className="grid gap-6">
                            {verificationResults.length > 0 ? (
                                verificationResults.map((claim) => (
                                    <div key={claim.id} className="bg-white p-6 rounded-lg border border-green-200 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-bl-lg">
                                            Verified {new Date(claim.verificationStatus.timestamp).toLocaleDateString()}
                                        </div>
                                        <h3 className="text-xl font-bold font-serif text-neutral-800 mb-2">{claim.category.replace('_', ' ')}</h3>
                                        <p className="text-lg text-neutral-700 mb-4">{claim.assertion}</p>
                                        
                                        <div className="bg-neutral-50 p-4 rounded text-sm font-mono text-neutral-600 overflow-x-auto">
                                            <p className="mb-1"><span className="font-bold">Proof Hash:</span> {claim.evidence.snapshotHash.substring(0, 20)}...</p>
                                            <p><span className="font-bold">Source:</span> {claim.evidence.sourceUrl}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-neutral-50 p-8 rounded-lg text-center text-neutral-600">
                                    <p>No significant AI engineering contributions found in your public repositories yet.</p>
                                    <p className="text-sm mt-2">Try creating a repository with topics like &quot;machine-learning&quot; or &quot;pytorch&quot;.</p>
                                </div>
                            )}
                        </div>
                        <button 
                            className="mt-8 text-neutral-500 hover:text-neutral-800 underline text-sm"
                            onClick={() => setVerificationResults(null)}
                        >
                            Start Over
                        </button>
                    </section>
                )}
            </div>
        </Layout>
    );
};

export default DashboardPage;
