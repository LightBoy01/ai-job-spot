# AI Job Spot

Welcome to AI Job Spot, a central hub for the latest AI job opportunities, built with Next.js, Firebase, and Tailwind CSS.

This project is designed for high performance, SEO-friendliness, and easy monetization through Google AdSense.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Setup Instructions](#setup-instructions)
  - [1. Initialize Next.js Project](#1-initialize-nextjs-project)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Firebase Project Setup](#3-firebase-project-setup)
  - [4. Environment Variables (.env.local)](#4-environment-variables-envlocal)
  - [5. Google AdSense Setup](#5-google-adsense-setup)
  - [6. Run the Application Locally](#6-run-the-application-locally)
  - [7. Deploy to Vercel](#7-deploy-to-vercel)

## Features

*   **Latest AI Job Postings:** Browse a curated list of AI job opportunities.
*   **Educational Content:** Access articles and guides related to AI careers.
*   **Modern UI/UX:** Clean, professional, and minimalist design powered by Tailwind CSS.
*   **SEO Optimized:** Server-rendered pages with dynamic metadata for maximum search engine visibility.
*   **Monetization Ready:** Integrated Google AdSense for seamless ad display.
*   **Responsive Design:** Optimized for various screen sizes (desktop, tablet, mobile).

## Technology Stack

*   **Framework:** [Next.js](https://nextjs.org/) (React framework for production, using **App Router**)
*   **Database:** [Firebase Firestore](https://firebase.google.com/docs/firestore) (NoSQL cloud database)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS framework)
*   **Deployment:** [Vercel](https://vercel.com/) (Platform for Next.js applications)

## Setup Instructions

Follow these steps to get the AI Job Spot project up and running on your local machine and deploy it.

### 1. Initialize Next.js Project

If you haven't already, create a new Next.js project. Navigate to your desired directory and run:

```bash
npx create-next-app@latest ai-job-spot --typescript --eslint --tailwind --app --src-dir --import-alias "@/*" --no-turbopack
cd ai-job-spot
```

**Note:** The `--typescript`, `--eslint`, `--tailwind`, `--app`, `--src-dir`, `--import-alias`, and `--no-turbopack` flags are used for this project's setup.

### 2. Install Dependencies

Install the necessary dependencies, including Firebase:

```bash
npm install firebase
# or
yarn add firebase
```

### 3. Firebase Project Setup

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click "Add project" and follow the steps to create a new project.

2.  **Register a Web App:**
    *   Once your project is created, click the "Web" icon (`</>`) to add a web app.
    *   Follow the instructions to register your app. You'll be given a `firebaseConfig` object.

3.  **Enable Firestore:**
    *   In the Firebase Console, navigate to "Firestore Database" from the left menu.
    *   Click "Create database". Choose "Start in production mode" (you can set up security rules later) and select a location.

4.  **Create Collections (Optional for initial setup, but needed for data):**
    *   **`jobs` collection:** This collection will store your job postings. Each document should have fields like `jobTitle`, `companyName`, `location`, `jobType`, `salaryRange` (optional), `jobDescription`, `slug`, and `createdAt` (Firestore Timestamp).
    *   **`articles` collection:** This collection will store your educational articles. Each document should have fields like `title`, `author`, `publishDate` (Firestore Timestamp), `contentBody`, and `slug`.

### 4. Environment Variables (.env.local)

Create a file named `.env.local` in the root of your project (the same directory as `package.json`). Populate it with your Firebase configuration and AdSense IDs:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"

# Google AdSense Publisher ID (e.g., ca-pub-1234567890123456)
NEXT_PUBLIC_ADSENSE_CLIENT="YOUR_ADSENSE_PUBLISHER_ID"

# AdSense Slot ID for the sidebar ad unit
NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT="YOUR_ADSENSE_SIDEBAR_SLOT_ID"
```

**Important:** Replace the placeholder values with your actual keys from the Firebase Console and Google AdSense.

### 5. Google AdSense Setup

To properly integrate Google AdSense, you need to add the main AdSense script to your root `src/app/layout.tsx` file. This is handled by the provided `layout.tsx`:

```typescript
// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Job Spot", // Default title, will be overridden by Layout component
  description: "Find the latest jobs in Artificial Intelligence, Machine Learning, and Data Science.", // Default description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense Script */}
        {process.env.NODE_ENV === 'production' && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          ></script>
        )}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

This ensures the AdSense script is loaded globally only in production.

### 6. Run the Application Locally

To start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### 7. Deploy to Vercel

1.  **Create a GitHub Repository:** Push your project to a new GitHub repository.

2.  **Connect to Vercel:**
    *   Go to [Vercel](https://vercel.com/) and sign in.
    *   Click "Add New..." -> "Project".
    *   Import your Git repository.

3.  **Configure Environment Variables in Vercel:**
    *   During the Vercel project setup, you'll be prompted to configure environment variables.
    *   Add all the `NEXT_PUBLIC_FIREBASE_...` and `NEXT_PUBLIC_ADSENSE_...` variables exactly as they are in your `.env.local` file.
    *   Ensure they are set for the "Production" and "Development" (if you use Vercel previews) environments.

4.  **Deploy:** Once the environment variables are set, Vercel will automatically build and deploy your application.

Your AI Job Spot website will now be live!