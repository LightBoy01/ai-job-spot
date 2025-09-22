# Diagnostic Scripts

This directory contains scripts for diagnosing issues with the AI Job Spot application.

## `fetch_job.ts`

This script fetches a single job document directly from the Firestore database using the Firebase Admin SDK and prints its contents to the console.

### Purpose

This is useful for bypassing the Next.js application and Vercel's caches to see the raw, true state of a job document in the database. It helps to diagnose issues where the live site might be showing stale or incorrect data.

### Usage

Run the script from the project's root directory using `ts-node`, passing the job ID as an argument:

```bash
./node_modules/.bin/ts-node scripts/diagnostics/fetch_job.ts <JOB_ID>
```

**Example:**

```bash
./node_modules/.bin/ts-node scripts/diagnostics/fetch_job.ts job-42
```
