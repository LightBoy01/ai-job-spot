import { GithubAuthProvider, signInWithPopup } from 'firebase/auth';
import Head from 'next/head';
import React, { useState } from 'react';

import type { VerifiedClaim, DeveloperDNA } from '@/lib/verification/types';

import Layout from '@/components/Layout';
import useAuth from '@/hooks/useAuth';

import { auth } from '../lib/firebase';

const DashboardPage = () => {
    const { loading: authLoading, user } = useAuth();
    const [isGitHubConnected, setIsGitHubConnected] = useState(false);
    const [connectError, setConnectError] = useState<null | string>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const [verificationResults, setVerificationResults] = useState<VerifiedClaim[] | null>(null);
    const [dna, setDna] = useState<DeveloperDNA | null>(null);

    const handleVerifySkills = async () => {
        if (!user) {
            setConnectError('You must be logged in to verify your skills.');
            return;
        }
        setIsConnecting(true);
        setConnectError(null);
        setVerificationResults(null);
        setDna(null);

        try {
            const provider = new GithubAuthProvider();
            provider.addScope('repo'); 
            const result = await signInWithPopup(auth, provider);
            const credential = GithubAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;

            if (token) {
                const idToken = await user.getIdToken();
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
                setDna(data.dna);
                setIsGitHubConnected(true);
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

    const handleViewDemo = async () => {
        if (!user) {
            setConnectError('You must be logged in to view the demo.');
            return;
        }
        setIsConnecting(true);
        setVerificationResults(null);
        setDna(null);

        try {
            const idToken = await user.getIdToken();
            // Use the MOCK token to trigger the demo response
            const response = await fetch('/api/integrations/github/verify', {
                body: JSON.stringify({ token: 'MOCK_VERIFICATION_TOKEN', userId: user.uid }),
                headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to load demo profile.');
            }

            const data = await response.json();
            setVerificationResults(data.claims);
            setDna(data.dna);
            setIsGitHubConnected(true);
        } catch (error: unknown) {
            console.error('Error loading demo:', error);
            setConnectError('Failed to load demo.');
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

                {!dna && !verificationResults && (
                    <section>
                        <h2 className="text-2xl font-bold font-sans text-neutral-800 border-b pb-3 mb-6">Analyze Your Developer DNA</h2>
                        <div className="bg-white p-8 rounded-lg border border-neutral-200 shadow-sm">
                            <div className="flex flex-col items-center space-y-4">
                                <button 
                                    className="bg-neutral-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-neutral-900 disabled:bg-neutral-400 transition-colors flex items-center" 
                                    disabled={isConnecting} 
                                    onClick={handleVerifySkills}
                                >
                                    <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                    </svg>
                                    {isConnecting ? 'Analyzing...' : 'Connect GitHub'}
                                </button>
                                
                                <button
                                    onClick={handleViewDemo}
                                    className="text-primary-blue hover:text-primary-dark text-sm font-medium underline"
                                    disabled={isConnecting}
                                >
                                    Want to see an example? View Demo Profile
                                </button>

                                {connectError && <p className="text-red-500 mt-2">{connectError}</p>}
                                <p className="text-center text-neutral-500 font-serif mt-2 text-sm max-w-md">
                                    We analyze your <strong>public</strong> repositories to generate your Developer DNA Profile and verify your AI engineering contributions.
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {dna && (
                    <div className="space-y-8 animate-fade-in">
                        {/* DNA Card */}
                        <section className="bg-white p-8 rounded-xl border border-neutral-200 shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold font-sans text-neutral-900">Your Developer DNA</h2>
                                    <p className="text-neutral-500 font-serif">Based on your public GitHub activity</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Share DNA</span>
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                        <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></label>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Archetype */}
                                <div className="bg-neutral-50 p-6 rounded-lg text-center border border-neutral-100">
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-2">Archetype</p>
                                    <p className="text-2xl font-bold text-primary-dark">{dna.archetype}</p>
                                    <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                        <div className="bg-primary-blue h-1.5 rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                </div>

                                {/* Languages */}
                                <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100">
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-4">Top Languages</p>
                                    <div className="space-y-3">
                                        {dna.topLanguages.map((lang) => (
                                            <div key={lang.name}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-semibold text-neutral-700">{lang.name}</span>
                                                    <span className="text-neutral-500">{lang.percentage}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                    <div 
                                                        className="h-1.5 rounded-full" 
                                                        style={{ 
                                                            width: `${lang.percentage}%`,
                                                            backgroundColor: lang.color || '#4B5563' // Fallback color
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Impact Stats */}
                                <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100 flex flex-col justify-center space-y-6">
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Total Stars</p>
                                        <p className="text-3xl font-bold text-neutral-800">{dna.totalStars.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Active Repos</p>
                                        <p className="text-3xl font-bold text-neutral-800">{dna.activeReposCount}</p>
                                        <p className="text-xs text-neutral-400 mt-1">(Last 6 months)</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Verified Claims Section */}
                        <section>
                            <h3 className="text-xl font-bold font-serif text-neutral-800 mb-4">Verified Claims</h3>
                            <div className="grid gap-4">
                                {verificationResults && verificationResults.length > 0 ? (
                                    verificationResults.map((claim) => (
                                        <div key={claim.id} className="bg-white p-5 rounded-lg border-l-4 border-green-500 shadow-sm flex justify-between items-center transition hover:shadow-md">
                                            <div>
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className="text-xs font-bold uppercase text-green-600 tracking-wide bg-green-50 px-2 py-0.5 rounded-full">Verified</span>
                                                    <span className="text-xs text-neutral-400">• {new Date(claim.verificationStatus.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <p className="font-medium text-neutral-800">{claim.assertion}</p>
                                            </div>
                                            <div className="hidden sm:block">
                                                <span className="text-2xl" role="img" aria-label="medal">🏅</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white p-6 rounded-lg border border-neutral-200 border-dashed text-center text-neutral-500">
                                        <p>No specific AI Engineering claims could be verified yet.</p>
                                        <p className="text-sm mt-1">Keep building! Contributions to AI repositories will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                        
                        <div className="text-center pt-4 border-t border-neutral-200">
                             <button 
                                className="text-neutral-400 hover:text-neutral-600 text-sm underline transition-colors"
                                onClick={() => { setVerificationResults(null); setDna(null); }}
                            >
                                Reset Analysis
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default DashboardPage;