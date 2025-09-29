import { getJobById } from '../src/lib/firestoreClient.ts';

const fetchAndPrintJob = async (jobId) => {
  try {
    const job = await getJobById(jobId);
    if (job) {
      // Manually serialize the job to match SerializedJobPosting
      const serializedJob = {
        ...job,
        postedDate: job.postedDate ? job.postedDate.toISOString() : null,
        expirationDate: job.expirationDate
          ? job.expirationDate.toISOString()
          : null,
        verificationDate: job.verificationDate
          ? job.verificationDate.toISOString()
          : null,
      };
      console.log(JSON.stringify(serializedJob, null, 2));
    } else {
      console.log(`Job with ID ${jobId} not found.`);
    }
  } catch (error) {
    console.error(`Error fetching job ${jobId}:`, error);
  }
};

fetchAndPrintJob('job-42');
