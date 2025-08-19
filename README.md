# AI Job Spot

Welcome to AI Job Spot, a central hub for the latest AI job opportunities. This project is built with Next.js, Firebase, and Tailwind CSS, and is designed for high performance, security, and maintainability.

## Table of Contents

- [Technology Stack](#technology-stack)
- [Key Features](#key-features)
- [Local Development Setup](#local-development-setup)
- [Deployment to Vercel](#deployment-to-vercel)

## Technology Stack

*   **Framework:** Next.js (React)
*   **Database:** Firebase Firestore
*   **Authentication:** Firebase Authentication
*   **Styling:** Tailwind CSS
*   **Deployment:** Vercel

## Key Features

*   **Static Site Generation (SSG) with ISR:** Public-facing pages are statically generated for maximum performance and SEO, with Incremental Static Regeneration to keep content fresh.
*   **Secure Admin Panel:** A full-featured admin dashboard with CRUD functionality for jobs and articles.
*   **Role-Based Access Control (RBAC):** Firestore rules and API middleware ensure only authenticated admins can perform write operations.
*   **XSS Protection:** All user-generated content is sanitized on the server-side to prevent Cross-Site Scripting attacks.
*   **Dynamic Sitemap:** A `sitemap.xml` is dynamically generated for optimal search engine crawling.

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd ai-job-spot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  Enable **Authentication** (with Email/Password provider) and **Firestore**.
3.  Go to **Project Settings** > **Service Accounts** and generate a new private key. This will download a JSON file.
4.  **Rename this file to `serviceAccountKey.local.json`** and place it in the root of your project. This file is listed in `.gitignore` and will not be committed.

### 4. Set Up Environment Variables

Create a file named `.env.local` in the project root. Add your Firebase web app configuration keys. You can find these in **Project Settings** > **General** > "Your apps".

```
# Public Firebase Keys (for client-side)
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"

# AdSense Keys (Optional)
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID="ca-pub-YOUR_ID"
NEXT_PUBLIC_ADSENSE_JOB_LISTING_SLOT="YOUR_SLOT_ID"
# ... other ad slots
```

### 5. Create an Admin User

1.  In the Firebase Console, go to **Authentication** > **Users** and add a new user with an email and password.
2.  You will need to set a custom claim for this user to grant them admin privileges. This is typically done with a script (like the `setAdminClaim.js` in this project) or manually in your backend.

### 6. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site. You can log in to the admin panel at [http://localhost:3000/admin](http://localhost:3000/admin).

## Deployment to Vercel

1.  Push your code to a GitHub repository.
2.  Import the repository into Vercel.
3.  In the Vercel project settings, add all the environment variables from your `.env.local` file.
4.  You must also add the service account key as a server-side secret. Create a new environment variable named `FIREBASE_SERVICE_ACCOUNT_BASE64`.
    *   **Value:** Copy the entire content of your `serviceAccountKey.local.json` file, encode it in Base64, and paste the resulting string. You can use an online tool or the following command:
    *   `cat serviceAccountKey.local.json | base64`

5.  Deploy. Vercel will handle the rest.
