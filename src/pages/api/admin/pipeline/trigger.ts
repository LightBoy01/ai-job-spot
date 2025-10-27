import type { NextApiResponse } from 'next';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { validateCsrfToken } from '../../csrf';
import { z } from 'zod';

// Define a Zod schema for the expected request body
const PipelineTriggerSchema = z.object({
  ref: z.string().optional(), // 'ref' is derived from env, but good to validate if present
  // Add other potential body parameters here if the API is extended
});

export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    await validateCsrfToken(req);
  } catch (error) {
    let message = 'Invalid CSRF token.';
    if (error instanceof Error) {
        message = error.message;
    }
    return res.status(403).json({ message });
  }

  // Validate the request body using Zod
  const validationResult = PipelineTriggerSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      message: 'Validation failed',
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  const { ref } = validationResult.data;

  const githubPat = process.env.GITHUB_PAT;
  const repoOwner = process.env.GITHUB_REPO_OWNER;
  const repoName = process.env.GITHUB_REPO_NAME;
  const workflowId = 'aggregate.yml'; // The name of your workflow file
  const branch = ref || process.env.VERCEL_GIT_COMMIT_REF || 'main'; // Use validated ref or fallback

  if (!githubPat || !repoOwner || !repoName) {
    const missingVars = [];
    if (!githubPat) missingVars.push('GITHUB_PAT');
    if (!repoOwner) missingVars.push('GITHUB_REPO_OWNER');
    if (!repoName) missingVars.push('GITHUB_REPO_NAME');
    const errorMessage = `Server configuration error: The following environment variables are missing: ${missingVars.join(', ')}`;
    console.error(errorMessage);
    res.status(500).json({ message: errorMessage });
    return;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowId}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${githubPat}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          ref: branch,
        }),
      }
    );

    if (response.ok) {
      res.status(200).json({ message: 'Workflow dispatch initiated successfully.' });
    } else {
      const errorData = await response.json();
      console.error('GitHub API error:', errorData);
      res.status(response.status).json({ message: 'Failed to dispatch workflow', details: errorData });
    }
  } catch (error) {
    console.error('Error dispatching workflow:', error);
    res.status(500).json({ message: 'Internal server error while dispatching workflow.' });
  }
}
