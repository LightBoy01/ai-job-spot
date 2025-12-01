// src/lib/analysis/engine.ts

import {
  getGitHubRepoList,
  getGitHubUserProfile,
  listCommitsForRepo,
} from '@/lib/githubService';

export interface DeveloperDnaReport {
  profile: {
    avatar_url: string;
    bio: null | string;
    blog: string;
    company: null | string;
    email: null | string;
    followers: number;
    following: number;
    location: null | string;
    login: string;
    name: null | string;
    public_repos: number;
    total_private_repos: number;
  };
  stats: {
    commitActivity: CommitActivity;
    languageBreakdown: LanguageMap;
    totalCommitsAnalyzed: number;
    totalReposAnalyzed: number;
  };
}

interface CommitActivity {
  // Index 0 = Sunday, 6 = Saturday
  byDay: [number, number, number, number, number, number, number];
}

interface LanguageMap {
  [language: string]: number;
}


/**
 * Generates a "Developer DNA" report for a given user.
 * @param uid The Firebase UID of the user.
 * @returns A structured report of the user's GitHub activity.
 */
export async function generateDeveloperDNA(uid: string): Promise<DeveloperDnaReport> {
  const profile = await getGitHubUserProfile(uid);
  const repos = await getGitHubRepoList(uid);

  // --- Analysis ---
  // To keep V1 speedy, we'll only analyze the 5 most recently pushed repos.
  const reposToAnalyze = repos.slice(0, 5);

  const languageBreakdown: LanguageMap = {};
  const commitActivity: CommitActivity = { byDay: [0, 0, 0, 0, 0, 0, 0] };
  let totalCommitsAnalyzed = 0;

  // 1. Language Analysis
  for (const repo of repos) { // Analyze all repos for language, it's fast
    if (repo.language) {
      languageBreakdown[repo.language] = (languageBreakdown[repo.language] || 0) + 1;
    }
  }

  // 2. Commit Analysis
  for (const repo of reposToAnalyze) {
    if (!repo.owner) continue;
    const commits = await listCommitsForRepo(uid, repo.owner.login, repo.name);
    
    for (const commit of commits) {
        // Filter for commits by the actual user
        if (commit.author?.login === profile.login) {
            totalCommitsAnalyzed++;
            if (commit.commit.author?.date) {
                const commitDate = new Date(commit.commit.author.date);
                const dayOfWeek = commitDate.getUTCDay(); // 0 = Sunday
                commitActivity.byDay[dayOfWeek]++;
            }
        }
    }
  }

  // --- Construct the Report ---
  const report: DeveloperDnaReport = {
    profile: {
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      blog: profile.blog ?? '',
      company: profile.company,
      email: profile.email,
      followers: profile.followers,
      following: profile.following,
      location: profile.location,
      login: profile.login,
      name: profile.name,
      public_repos: profile.public_repos,
      total_private_repos: profile.total_private_repos || 0,
    },
    stats: {
      commitActivity,
      languageBreakdown,
      totalCommitsAnalyzed,
      totalReposAnalyzed: reposToAnalyze.length,
    },
  };

  return report;
}
