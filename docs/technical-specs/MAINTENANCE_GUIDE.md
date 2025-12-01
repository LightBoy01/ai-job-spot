# Maintenance & Operations Guide

This document provides instructions for common maintenance tasks for the AI Job Spot platform.

---

## 1. Content Management

The project uses a "content-as-code" approach. All articles and job postings are stored as Markdown files in the `src/articles` and `src/job-descriptions` directories, respectively.

### Adding or Updating Content

1.  **Create or Edit a Markdown File:** Add a new `.md` file to the appropriate directory or edit an existing one.
2.  **Ensure Correct Frontmatter:** Each file must begin with YAML frontmatter containing all required metadata (e.g., `title`, `company`, `postedDate`). Refer to existing files for the correct structure.
3.  **Run the Seeding Script:** After adding or updating files, you must run the database seeding script to sync the changes with Firestore. Execute the following command from the project root:

    ```bash
    npx ts-node --project tsconfig.node.json seedFirestore.ts
    ```

### Deleting Content

To properly delete content and avoid orphaned data in the database, follow these steps:

1.  **Delete the Markdown File:** Remove the corresponding `.md` file from the `src/articles` or `src/job-descriptions` directory.
2.  **Run the Seeding Script:** The seeding script is designed to handle deletions. It will compare the files in the filesystem with the documents in Firestore and automatically remove any documents that no longer have a corresponding file.

    ```bash
    npx ts-node --project tsconfig.node.json seedFirestore.ts
    ```

    *(Note: This deletion logic is being implemented as part of the current development task.)*

---

## 2. Environment Variables

Sensitive information and configuration details are stored in environment variables. A local environment file is required for development.

1.  **Create `.env.local`:** In the project root, create a file named `.env.local`.
2.  **Populate Variables:** Add the necessary Firebase and other service credentials to this file. Refer to the `.env.example` file (if present) or the project setup documentation for a list of required variables.

    **Important:** The `FIREBASE_SERVICE_ACCOUNT_JSON` variable should contain the raw, single-line JSON content of your Firebase service account key.

---

## 3. Deployment

The project is deployed on Vercel. Deployments are automatically triggered by pushing changes to the main branch of the Git repository.

### Revalidating Content

The site uses Incremental Static Regeneration (ISR) to keep content fresh. Pages are automatically revalidated after a certain period (e.g., 60 seconds).

To manually force a revalidation of a specific page, you can use the `revalidate` API route if needed, though this is typically not required during normal operation.
