# AI Job Spot

This is a Next.js project for "AI Job Spot," a central hub for the latest AI job opportunities. It's built with Next.js, Firebase Firestore, and Tailwind CSS, designed for SEO, performance, and monetization through Google AdSense.

## Getting Started

Follow these steps to set up and run the project locally, and deploy it to Vercel.

### 1. Project Initialization (if starting from scratch)

If you haven't already, you can initialize a Next.js project. For this project, we used:

```bash
npx create-next-app@latest ai-job-spot --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 2. Install Dependencies

Navigate into the project directory and install the necessary dependencies, including Firebase:

```bash
cd ai-job-spot
npm install
npm install firebase
```

### 3. Firebase Project Setup

1.  **Create a new Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click "Add project" and follow the steps to create a new project.

2.  **Register a Web App:**
    *   In your Firebase project, click the "Web" icon (</>) to add a web app.
    *   Follow the steps and register your app. You'll be given a `firebaseConfig` object.

3.  **Enable Firestore Database:**
    *   In the Firebase Console, navigate to "Firestore Database" from the left-hand menu.
    *   Click "Create database" and choose "Start in production mode" (you can adjust security rules later).
    *   Select a Cloud Firestore location near your users.

### 4. Environment Variables (`.env.local`)

Create a `.env.local` file in the root of your `ai-job-spot` project. This file will store your Firebase configuration keys. **Do not commit this file to Git.**

Replace the placeholder values with your actual `firebaseConfig` values obtained from the Firebase Console:

```
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT=YOUR_ADSENSE_SIDEBAR_SLOT
```

*   `NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT`: This is your Google AdSense ad slot ID for the sidebar. You'll get this from your AdSense account when you create an ad unit.

### 5. Deploy to Vercel

1.  **Connect to Git:** Push your project to a Git repository (GitHub, GitLab, Bitbucket).
2.  **Import Project in Vercel:**
    *   Go to [Vercel](https://vercel.com/) and log in.
    *   Click "Add New..." -> "Project" and import your Git repository.
3.  **Configure Environment Variables in Vercel:**
    *   During the Vercel project setup, or later in your project settings under "Environment Variables," add the same `NEXT_PUBLIC_FIREBASE_` and `NEXT_PUBLIC_ADSENSE_` variables with their respective values. These are crucial for your deployed application to connect to Firebase and display ads.

### 6. Run the Application Locally

Once all dependencies are installed and your `.env.local` file is set up, you can run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

*   `src/app/`: Next.js App Router pages and layouts.
*   `src/components/`: Reusable React components (e.g., `Navbar`, `JobCard`, `AdContainer`).
*   `src/lib/firebase.ts`: Firebase initialization and data fetching logic.
*   `src/lib/types.ts`: TypeScript interfaces for data structures.
*   `public/`: Static assets.

