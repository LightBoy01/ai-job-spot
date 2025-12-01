import { Octokit } from 'octokit';

import { decrypt } from './encryption';
// src/lib/githubService.ts
import { admin } from './firebaseAdmin';

// Future functions for the analysis engine will go here.
// TODO: Define a strong type for the analysis report
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getGitHubRepoList(uid: string): Promise<Record<string, any>[]> {
  try {
    const token = await getDecryptedGitHubToken(uid);
    const octokit = new Octokit({ auth: token });

    // Fetches repositories the user owns or has contributed to
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 50, // Limit to 50 most recent to keep analysis time reasonable for V1
      sort: 'pushed',
      type: 'all', // 'owner' is too restrictive, 'all' includes collaborations
    });
    return data;
  } catch (error: unknown) {
    console.error(`Failed to get GitHub repo list for UID: ${uid}`, error);
    throw error;
  }
}

/**
 * Fetches the authenticated user's GitHub profile using their stored token.
 * This is a good way to verify that the token is valid.
 * @param uid The Firebase UID of the user.
 * @returns The user's GitHub profile data.
 */
// TODO: Define a strong type for the analysis report
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getGitHubUserProfile(uid: string): Promise<Record<string, any>> {
  try {
    const token = await getDecryptedGitHubToken(uid);
    const octokit = new Octokit({ auth: token });

    const { data } = await octokit.rest.users.getAuthenticated();
    
    return data;
  } catch (error: unknown) {
    console.error(`Failed to get GitHub user profile for UID: ${uid}`, error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

// TODO: Define a strong type for the analysis report
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listCommitsForRepo(uid: string, owner: string, repo: string): Promise<Record<string, any>[]> {
    try {
        const token = await getDecryptedGitHubToken(uid);
        const octokit = new Octokit({ auth: token });

        const commits = await octokit.paginate(octokit.rest.repos.listCommits, {
            owner,
            per_page: 100,
            repo,
        });

        return commits;
    } catch (error: unknown) {
        console.error(`Failed to list commits for repo ${owner}/${repo} for UID: ${uid}`, error);
        throw error;
    }
}

/**
 * Retrieves a user's decrypted GitHub access token.
 * @param uid The Firebase UID of the user.
 * @returns The decrypted access token.
 * @throws If the integration document or token is not found.
 */
async function getDecryptedGitHubToken(uid: string): Promise<string> {
  const db = admin.firestore();
  const docRef = db.collection('userIntegrations').doc(uid);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error('GitHub integration not found for this user.');
  }

  const data = doc.data();
  const encryptedToken = data?.github?.accessToken;

  if (!encryptedToken) {
    throw new Error('GitHub access token not found in the integration document.');
  }

  return decrypt(encryptedToken);
}
