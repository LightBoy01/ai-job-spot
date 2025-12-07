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
    const [isPublic, setIsPublic] = useState(false);

    // Load existing profile data on mount/auth
    React.useEffect(() => {
        const loadProfile = async () => {
            if (user) {
                try {
                    const idToken = await user.getIdToken();
                    const response = await fetch('/api/user/profile', {
                        headers: { 'Authorization': `Bearer ${idToken}` }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.verifiedClaims) setVerificationResults(data.verifiedClaims);
                        if (data.developerDNA) setDna(data.developerDNA);
                        if (typeof data.isPublic === 'boolean') setIsPublic(data.isPublic);
                    }
                } catch (error) {
                    console.error("Failed to load profile:", error);
                }
            }
        };
        loadProfile();
    }, [user]);

    const handleTogglePublic = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.checked;
        setIsPublic(newValue); // Optimistic update

        if (!user) return;

        try {
            const idToken = await user.getIdToken();
            await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isPublic: newValue })
            });
        } catch (error) {
            console.error('Failed to update settings:', error);
            setIsPublic(!newValue); // Revert on error
        }
    };

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

    if (authLoading) return <Layout><div className="text-center p-12 font-serif text-primary-dark">Loading user...</div></Layout>;
    if (!user) return <Layout><div className="text-center p-12 font-serif text-primary-dark">Please log in to view your dashboard.</div></Layout>;

    return (
        <Layout>
            <Head>
                <title>Your Dossier | AI Job Spot</title>
                <meta content="noindex, nofollow" name="robots" />
            </Head>

            <div className="min-h-screen bg-neutral-cream">
                <div className="max-w-5xl mx-auto px-6 py-16">
                    <header className="mb-16 text-center">
                        <span className="text-secondary font-serif italic text-lg tracking-wider">Private & Confidential</span>
                        <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary-dark mt-2 mb-6">Executive Dossier</h1>
                        <div className="h-1 w-24 bg-secondary mx-auto mb-6"></div>
                        <p className="text-xl text-neutral-600 font-sans max-w-2xl mx-auto leading-relaxed">
                            A verified compendium of your professional capabilities, engineered for trust and simplicity.
                        </p>
                    </header>

                    {!dna && !verificationResults && (
                        <section className="max-w-2xl mx-auto">
                            <div className="bg-white p-10 rounded-sm shadow-lg border-t-4 border-secondary">
                                <h2 className="text-3xl font-serif font-bold text-primary-dark mb-6 text-center">Initiate Verification</h2>
                                <p className="text-neutral-600 text-center mb-8 font-sans text-lg">
                                    Connect your GitHub account to generate your cryptographic proof of skill.
                                </p>
                                <div className="flex flex-col items-center space-y-6">
                                    <button 
                                        className="bg-primary hover:bg-primary-dark text-white font-serif text-lg py-4 px-10 rounded-sm transition-all duration-300 shadow-md hover:shadow-xl flex items-center tracking-wide" 
                                        disabled={isConnecting} 
                                        onClick={handleVerifySkills}
                                    >
                                        <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                        </svg>
                                        {isConnecting ? 'Analyzing...' : 'Connect GitHub Identity'}
                                    </button>
                                    
                                    <button
                                        onClick={handleViewDemo}
                                        className="text-secondary hover:text-secondary-dark text-base font-serif italic underline transition-colors"
                                        disabled={isConnecting}
                                    >
                                        View Sample Dossier
                                    </button>

                                    {connectError && <p className="text-red-800 bg-red-50 px-4 py-2 border border-red-200 text-sm font-sans">{connectError}</p>}
                                </div>
                            </div>
                        </section>
                    )}

                    {dna && (
                        <div className="space-y-12 animate-fade-in">
                            {/* Settings & Sharing Control Panel */}
                            <section className="bg-white p-6 rounded-sm shadow-sm border border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h3 className="text-lg font-serif font-bold text-primary-dark mb-1">Profile Visibility</h3>
                                    <p className="text-sm text-neutral-500 font-sans">
                                        {isPublic 
                                            ? "Your dossier is currently public and accessible via the link." 
                                            : "Your dossier is private. Only you can view it."}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-6">
                                    <div className="flex items-center space-x-3">
                                        <span className={`text-sm font-bold uppercase tracking-wider ${isPublic ? 'text-primary' : 'text-neutral-400'}`}>
                                            {isPublic ? 'Public' : 'Private'}
                                        </span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={isPublic}
                                                onChange={handleTogglePublic}
                                            />
                                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                                        </label>
                                    </div>
                                    
                                    {user && (
                                        <a 
                                            href={isPublic ? `/profile/${user.uid}` : '#'}
                                            target={isPublic ? "_blank" : undefined}
                                            rel={isPublic ? "noopener noreferrer" : undefined}
                                            className={`px-5 py-2 rounded-sm font-serif text-sm font-bold transition-colors border ${
                                                isPublic 
                                                    ? 'bg-primary text-white border-primary hover:bg-primary-dark hover:border-primary-dark' 
                                                    : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                                            }`}
                                            onClick={(e) => !isPublic && e.preventDefault()}
                                        >
                                            View Public Dossier
                                        </a>
                                    )}
                                </div>
                            </section>

                            {/* DNA Card */}
                            <section className="bg-white p-8 md:p-12 rounded-sm shadow-lg border-t-4 border-secondary relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <svg className="w-64 h-64 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0L1.6 6v12L12 24l10.4-6V6L12 0zm0 2.3l8.3 4.8v9.6L12 21.7 3.7 16.7V7.1L12 2.3z"/></svg>
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-end mb-10 border-b border-neutral-200 pb-6">
                                        <div>
                                            <h2 className="text-4xl font-serif font-bold text-primary-dark mb-2">Developer DNA</h2>
                                            <p className="text-secondary font-serif italic">Cryptographic Analysis of Public Activity</p>
                                        </div>
                                        <div className="hidden md:block text-right">
                                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Status</p>
                                            <p className="text-accent font-bold font-serif text-lg flex items-center justify-end">
                                                <span className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse"></span>
                                                Verified Active
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                        {/* Archetype */}
                                        <div className="text-center md:text-left">
                                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Primary Archetype</p>
                                            <p className="text-4xl font-serif font-bold text-primary-dark mb-4">{dna.archetype}</p>
                                            <div className="h-1 w-full bg-neutral-100">
                                                <div className="h-1 bg-secondary w-[85%]"></div>
                                            </div>
                                            <p className="mt-4 text-neutral-500 font-sans italic text-sm">
                                                &quot;Demonstrates consistent high-level architectural patterns.&quot;
                                            </p>
                                        </div>

                                        {/* Languages */}
                                        <div>
                                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6">Linguistic Proficiency</p>
                                            <div className="space-y-5">
                                                {dna.topLanguages.map((lang) => (
                                                    <div key={lang.name}>
                                                        <div className="flex justify-between text-base mb-2 font-serif">
                                                            <span className="text-primary-dark">{lang.name}</span>
                                                            <span className="text-secondary">{lang.percentage}%</span>
                                                        </div>
                                                        <div className="w-full bg-neutral-100 h-px">
                                                            <div 
                                                                className="h-px bg-primary-dark" 
                                                                style={{ width: `${lang.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Impact Stats */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-neutral-50 p-4 border border-neutral-200 text-center">
                                                <p className="text-3xl font-serif font-bold text-primary-dark mb-1">{dna.totalStars.toLocaleString()}</p>
                                                <p className="text-xs text-neutral-500 uppercase tracking-widest">Total Stars</p>
                                            </div>
                                            <div className="bg-neutral-50 p-4 border border-neutral-200 text-center">
                                                <p className="text-3xl font-serif font-bold text-primary-dark mb-1">{dna.activeReposCount}</p>
                                                <p className="text-xs text-neutral-500 uppercase tracking-widest">Active Repos</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Verified Claims Section */}
                            <section>
                                <h3 className="text-3xl font-serif font-bold text-primary-dark mb-8 text-center">Verified Claims</h3>
                                <div className="grid gap-6">
                                    {verificationResults && verificationResults.length > 0 ? (
                                        verificationResults.map((claim) => (
                                            <div key={claim.id} className="bg-white p-8 rounded-sm border border-neutral-200 shadow-md flex flex-col md:flex-row justify-between items-center relative overflow-hidden group hover:border-secondary transition-colors duration-300">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>
                                                
                                                <div className="flex-1 pr-8 relative z-10">
                                                    <div className="flex items-center space-x-3 mb-3">
                                                        <span className="bg-accent/10 text-accent border border-accent/20 px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-sm">
                                                            Verified
                                                        </span>
                                                        <span className="text-xs text-neutral-400 font-serif italic">
                                                            Ref: {claim.id.substring(0, 8)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xl text-primary-dark font-serif leading-snug">
                                                        {claim.assertion}
                                                    </p>
                                                    <p className="text-sm text-neutral-500 mt-3 font-sans">
                                                        Verified on {new Date(claim.verificationStatus.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} via GitHub OAuth
                                                    </p>
                                                </div>

                                                <div className="mt-6 md:mt-0 relative z-10">
                                                    {/* Seal Icon */}
                                                    <div className="w-16 h-16 rounded-full border-2 border-secondary text-secondary flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-white p-12 rounded-sm border border-dashed border-neutral-300 text-center">
                                            <p className="text-neutral-500 font-serif text-lg italic">No verified claims generated from current data.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                            
                            <div className="text-center pt-8 border-t border-neutral-200">
                                 <button 
                                    className="text-neutral-400 hover:text-primary-dark text-sm font-serif italic underline transition-colors"
                                    onClick={() => { setVerificationResults(null); setDna(null); }}
                                >
                                    Reset Analysis Session
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default DashboardPage;