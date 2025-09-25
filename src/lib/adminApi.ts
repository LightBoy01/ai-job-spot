import { JobFormData } from './validationSchemas';
import { JobPosting } from './types';

export async function createJob(
  jobData: JobFormData,
  idToken: string
): Promise<JobPosting> {
  const response = await fetch('/api/admin/jobs/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(jobData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to add job posting');
  }

  const result = await response.json();
  return result.job as JobPosting;
}

export async function updateJob(
  jobId: string,
  jobData: JobFormData,
  idToken: string
): Promise<JobPosting> {
  const response = await fetch(`/api/admin/jobs/${jobId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(jobData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update job posting');
  }

  const result = await response.json();
  return result.job as JobPosting;
}
