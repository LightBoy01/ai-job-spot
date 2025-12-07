import { GetServerSideProps } from 'next';
import Head from 'next/head';
import React from 'react';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { DeveloperDNA, VerifiedClaim } from '@/lib/verification/types';
import Link from 'next/link';

interface PublicProfileProps {
  profile: {
    developerDNA: DeveloperDNA;
    verifiedClaims: VerifiedClaim[];
    updatedAt: string;
  } | null;
  error?: string;
}

export default function PublicProfile({ profile, error }: PublicProfileProps) {
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-neutral-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-lg border-t-4 border-red-800 text-center">
          <h1 className="text-2xl font-serif font-bold text-primary-dark mb-4">Access Restricted</h1>
          <p className="text-neutral-600 font-sans mb-6">
            {error || "This profile is private or does not exist."}
          </p>
          <Link href="/" className="text-secondary hover:text-secondary-dark font-serif italic underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const { developerDNA: dna, verifiedClaims } = profile;

  return (
    <div className="min-h-screen bg-neutral-cream font-sans selection:bg-secondary selection:text-white">
      <Head>
        <title>Verified Dossier | AI Job Spot</title>
        <meta name="description" content={`Verified Developer Profile for ${dna.archetype}`} />
      </Head>

      {/* Navigation Bar */}
      <nav className="bg-primary-dark text-white py-4 px-6 shadow-md">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
            <Link href="/" className="font-serif font-bold text-xl tracking-wider">
                AI Job Spot
            </Link>
            <span className="text-xs font-sans text-neutral-400 uppercase tracking-widest border border-neutral-600 px-3 py-1 rounded-sm">
                Verified Record
            </span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        
        {/* Header / Title */}
        <header className="text-center mb-12">
            <div className="inline-block mb-4">
                <span className="bg-secondary/10 text-secondary border border-secondary/20 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] rounded-sm">
                    Official Transcript
                </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary-dark mb-6">
                {dna.archetype}
            </h1>
            <p className="text-xl text-neutral-600 font-serif italic max-w-2xl mx-auto">
                A cryptographically verified record of AI engineering capabilities.
            </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: DNA Stats */}
            <div className="lg:col-span-4 space-y-6">
                {/* Core Stats */}
                <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-200">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6 border-b border-neutral-100 pb-2">Core Competencies</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-serif text-primary-dark">
                                <span>Total Impact</span>
                                <span className="font-bold">{dna.totalStars.toLocaleString()} Stars</span>
                            </div>
                            <div className="w-full bg-neutral-100 h-1">
                                <div className="h-1 bg-secondary" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-serif text-primary-dark">
                                <span>Active Repos</span>
                                <span className="font-bold">{dna.activeReposCount}</span>
                            </div>
                            <div className="w-full bg-neutral-100 h-1">
                                <div className="h-1 bg-accent" style={{ width: `${Math.min(dna.activeReposCount * 10, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Languages */}
                <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-200">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6 border-b border-neutral-100 pb-2">Tech Stack</h3>
                    <div className="space-y-4">
                        {dna.topLanguages.map((lang) => (
                            <div key={lang.name} className="group">
                                <div className="flex justify-between text-base mb-1 font-serif">
                                    <span className="text-primary-dark group-hover:text-secondary transition-colors">{lang.name}</span>
                                    <span className="text-neutral-400 text-sm">{lang.percentage}%</span>
                                </div>
                                <div className="w-full bg-neutral-100 h-0.5">
                                    <div 
                                        className="h-0.5 bg-primary" 
                                        style={{ width: `${lang.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Verified Claims */}
            <div className="lg:col-span-8">
                <div className="bg-white p-8 md:p-10 rounded-sm shadow-lg border-t-4 border-secondary relative overflow-hidden">
                    {/* Watermark */}
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                        <svg className="w-96 h-96" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0L1.6 6v12L12 24l10.4-6V6L12 0zm0 2.3l8.3 4.8v9.6L12 21.7 3.7 16.7V7.1L12 2.3z"/></svg>
                    </div>

                    <h2 className="text-2xl font-serif font-bold text-primary-dark mb-8 flex items-center">
                        <span className="bg-secondary w-2 h-8 mr-4"></span>
                        Verified Assertions
                    </h2>

                    <div className="space-y-8 relative z-10">
                        {verifiedClaims.map((claim) => (
                            <div key={claim.id} className="border-b border-neutral-100 pb-8 last:border-0 last:pb-0">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mr-4 mt-1">
                                        <div className="w-6 h-6 rounded-full border border-green-500 flex items-center justify-center text-green-500">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-lg text-primary-dark font-serif leading-relaxed font-medium">
                                            {claim.assertion}
                                        </p>
                                        <div className="mt-3 flex items-center text-xs text-neutral-400 font-sans tracking-wide">
                                            <span className="uppercase">Verified via GitHub</span>
                                            <span className="mx-2">•</span>
                                            <span>{new Date(claim.verificationStatus.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            <span className="mx-2">•</span>
                                            <span className="font-mono text-neutral-300">ID: {claim.id.substring(0, 8)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Seal */}
                    <div className="mt-12 pt-8 border-t border-neutral-200 flex justify-between items-end">
                        <div className="text-xs text-neutral-400 font-sans max-w-xs">
                            This document is cryptographically generated based on public data snapshots. 
                            <br/>Verification is valid as of the timestamp indicated.
                        </div>
                        <div className="text-right">
                            <div className="inline-flex flex-col items-center">
                                <span className="font-serif text-primary-dark font-bold italic text-lg">AI Job Spot</span>
                                <span className="text-[10px] uppercase tracking-widest text-secondary">Verification Authority</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { userId } = context.params as { userId: string };

  try {
    const { adminDb } = await getFirebaseAdmin();
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return { props: { error: 'Profile not found' } };
    }

    const data = userDoc.data();

    // Privacy Check: Only show if isPublic is explicitly true
    if (!data?.isPublic) {
        return { props: { error: 'This profile is private.' } };
    }

    // Convert Timestamps to strings for serialization
    const profile = {
        developerDNA: data?.developerDNA || null,
        verifiedClaims: data?.verifiedClaims || [],
        updatedAt: data?.updatedAt?.toDate().toISOString() || new Date().toISOString(),
    };

    return {
      props: { profile },
    };
  } catch (error) {
    console.error('Error fetching public profile:', error);
    return { props: { error: 'Server error' } };
  }
};
