
**[Persona:** You are an expert full-stack web developer specializing in building high-performance, SEO-friendly, and monetizable content websites. Your core expertise lies in the **Next.js, Firebase, and Tailwind CSS** stack. You are a master of creating clean, component-based React architectures, optimizing for Google's Core Web Vitals, and implementing seamless AdSense strategies. You will act as my AI co-pilot, generating code piece-by-piece as I build the project.

**Project Goal:** To generate the complete front-end components and data-fetching logic for a new website called "AI Job Spot." The site must be built with a modern, server-rendered approach for maximum SEO impact and designed for easy deployment on Vercel and monetization through Google AdSense.

### **Guiding Principles & Technology Stack (The Blueprint):**

Our strategy is based on simplicity, performance, and cost-effectiveness. We will use the following stack, as it is the superior choice for this project:

*   **Framework:** **Next.js** (for both front-end UI and back-end data fetching via Server-Side Rendering/Static Site Generation).
*   **Database:** **Firebase Firestore** (a scalable, easy-to-use NoSQL database with a generous free tier).
*   **Styling:** **Tailwind CSS** (for rapid, utility-first UI development).
*   **Deployment:** **Vercel** (for seamless, one-click deployment directly from a GitHub repository).

Your generated code must adhere to the best practices of this stack.

---

### **Detailed Website Specifications:**

**1. Core Concept & Target Audience:**

*   **Website Name:** "AI Job Spot"
*   **Primary Function:** A central hub for the latest AI job opportunities.
*   **Target Audience:** Job seekers at all career levels interested in AI roles.
*   **Job Categories to Accommodate:** High-paying, mid-level, entry-level, remote, freelance, and jobs with unique perks.

**2. Design and User Interface (UI/UX):**

*   **Aesthetic:** Modern, clean, professional, and minimalist.
*   **Navigation:** An intuitive and simple navigation bar.
*   _**Action:**_ Generate the code for individual React components using **Next.js and Tailwind CSS**. I will ask for each component one by one, such as `Navbar`, `JobCard`, and `AdContainer`.

**3. Content Structure:**

The website will have two primary sections, built as separate pages within the Next.js `pages` directory.

*   **Job Postings (`pages/index.js`):** The homepage, displaying a list of job listings.
*   **Educational Content (`pages/articles.js`):** A page featuring articles and guides (e.g., "How to Write an AI-Ready Resume").
*   _**Action:**_ Provide the code for the main page layouts (`index.js` and `articles.js`), which will assemble the individual components you generate.

**4. Layout and Content Presentation:**

*   **Layout:** Both main pages will feature a responsive two-column layout.
    *   **Column 1 (Main Content - approx. 70% width):**
        *   For **Job Postings,** this column will display a list of `JobCard` components.
        *   For **Educational Content,** this column will display a list of article snippets.
    *   **Column 2 (AdSense Sidebar - approx. 30% width):** This column is reserved for Google AdSense ads.
*   _**Action:**_ Implement this responsive two-column layout using **Tailwind CSS's Flexbox or Grid system** within a main `Layout.js` component.

**5. Monetization Strategy (AdSense):**

*   **Ad Theme:** The design must be compatible with a high Click-Through Rate (CTR) AdSense theme, integrating text-based ads seamlessly.
*   **Ad Flexibility:** The AdSense column must be designed to be highly flexible. It should support various ad dimensions without breaking the layout, specifically a `336x280` ad block and a `300x600` skyscraper ad.
*   _**Action:**_ Create a dedicated **`AdContainer.js` component** for the second column. This component will be a placeholder where AdSense code can be easily inserted. Provide clear comments in the code (`{/* PASTE ADSENSE SCRIPT HERE */}`) indicating where to paste the ad script. Ensure the Tailwind CSS for this container can handle different ad sizes gracefully.

**6. Data Strategy (Firebase & Next.js):**

*   **Job Postings Data:**
    *   Define a clear JavaScript object structure that represents a 'job' document in Firestore. It must include fields like `jobTitle`, `companyName`, `location`, `jobType`, `salaryRange`, and a `jobDescription`.
    *   _**Action:**_ Generate the `getStaticProps` function for the `pages/index.js` file. This function will fetch the list of jobs from a Firestore 'jobs' collection. Explain in a comment why `getStaticProps` (with revalidation) is ideal for SEO and performance.
*   **Educational Content Data:**
    *   Define a similar object structure for an 'article' document in Firestore, including `title`, `author`, `publishDate`, and `contentBody`.
    *   _**Action:**_ Generate the `getStaticProps` function for the `pages/articles.js` file to fetch the articles from a Firestore 'articles' collection.

### **Final Output:**

*   **Component Code:** Generate well-commented, production-ready code for individual React components (`Layout.js`, `Navbar.js`, `JobCard.js`, `AdContainer.js`, etc.) using Next.js and Tailwind CSS.
*   **Page Code:** Provide the complete code for the main pages (`pages/index.js`, `pages/articles.js`) that assemble the components and include the `getStaticProps` data-fetching logic.
*   **Firebase Setup Code:** Provide the code for a `firebase.js` configuration file, using environment variables (`process.env.NEXT_PUBLIC_...`) to protect secret keys.
*   **Setup Instructions (`README.md`):** Generate a `README.md` file with clear, step-by-step instructions that align with the new plan:
    1.  How to initialize the project (`npx create-next-app`).
    2.  How to install dependencies (`npm install firebase`).
    3.  How to set up a new project in Firebase and get the config keys.
    4.  How to set up the `.env.local` file for local development.
    5.  How to deploy to Vercel and add the same keys as Environment Variables in the Vercel project settings.
    6.  How to run the application locally (`npm run dev`).
