# The AI Job Spot "Proof-of-Skill" Blueprint

## 1. Vision & Mission

**Vision:** To build the foundational trust layer for the global labor market, evolving AI Job Spot from a niche job board into a trillion-dollar economic primitive.

**Mission:** To solve the "Friction of Trust" in hiring by replacing subjective resumes and interviews with a "Verified Output Protocol." We will create a universal, cryptographic standard for proving human skill, thereby enabling a liquid, efficient, and unbiased global market for labor.

---

## 2. Core Concepts

-   **Verified Output Protocol:** An API-driven system that integrates with common work tools (e.g., GitHub, Salesforce, Figma) to pull objective, anonymized metadata about a user's work history.
-   **Work Score:** A mathematically derived score representing a user's proven capability and consistency in a specific skill domain, based on the Verified Output Protocol.
-   **Proof-of-Work Token:** A cryptographic key or token that a candidate can generate and share. It grants a potential employer temporary, read-only access to their verified Work Score and anonymized performance data, without revealing private information.
-   **Work Wallets:** A user-centric concept where individuals connect their various work tool accounts (GitHub, Jira, etc.) to their AI Job Spot profile to build their verified skill identity.

---

## 3. The 10-Year Roadmap

This initiative is envisioned in three distinct, sequential phases:

| Phase | Timeframe | The Evolution | The Value Proposition |
| :---- | :-------- | :------------- | :------------------ |
| 1. The Utility | Years 1-3 | "The Truth Button" | The job board becomes the only place where employers are guaranteed the candidate can do the job. Hiring time drops from weeks to hours. |
| 2. The Platform| Years 3-6 | "The Identity Layer" | Other platforms (job boards, banks, universities) use our API to verify skills. We become the "FICO for work." |
| 3. The Economy| Years 7-10 | "Liquid Labor Market" | Instant, risk-free hiring via smart contracts becomes possible. We facilitate a percentage of global wage flow. |

---

## 4. Phase 0: The Cold Start Strategy - "Private Career Analytics" MVP

To solve the critical "chicken-and-egg" problem, we must provide immense, standalone value to one side of the market first: the **candidate**.

**Strategy:** Deliver a private, personal analytics dashboard that helps developers understand and benchmark their own skills. This provides immediate value without any dependency on employers.

**MVP Features:**

1.  **Developer DNA Report:**
    -   **Code Analysis:** Visualize language proficiency, commit frequency, and project contributions.
    -   **Impact Metrics:** Identify and highlight a user's most significant work (e.g., most complex commits, bug fixes that unblocked a team).
    -   **Habit & Pattern Recognition:** Provide insights into their personal work habits (e.g., "You are most productive on Tuesday mornings").

2.  **Anonymous Benchmarking:**
    -   Allow users to see how their verified metrics (e.g., code churn rate, PR merge time) compare to the anonymized aggregate of other users on the platform. This provides powerful context and a strong incentive for others to join.

---

## 5. High-Level Architecture (MVP)

The initial implementation will consist of the following components within the existing Next.js application:

1.  **Frontend:**
    -   A new, protected route at `/dashboard`.
    -   React components for displaying charts, stats, and reports.
    -   A settings area within the dashboard for managing connected "Work Wallets" (starting with GitHub).

2.  **Authentication:**
    -   Implementation of a GitHub OAuth2 flow to allow users to securely connect their accounts.
    -   The system must only request read-only permissions for public and private repository metadata. It will not need access to read the code itself.

3.  **Backend (Next.js API Routes):**
    -   An API route to handle the GitHub OAuth callback.
    -   Secure endpoints for storing and retrieving encrypted API tokens.
    *   An API route to trigger on-demand analysis for a user.

4.  **Data Store (Firebase Firestore):**
    -   A new collection `userIntegrations` to store users' encrypted OAuth tokens from external services.
    -   A new collection `skillReports` to store the results of the analysis, allowing for caching and historical tracking.

5.  **Analysis Engine:**
    -   A modular, server-side TypeScript service (`src/lib/analysis/`).
    -   The first module will be `githubAnalyzer.ts`, responsible for using the GitHub API to fetch user data and compute the "Developer DNA" metrics.

---

## 6. Guiding Principles

-   **Privacy and Security First:** The user is the sole owner of their data. All API tokens will be stored with strong encryption (e.g., using a dedicated Key Management Service or equivalent environment-based secrets). Analysis is private by default and is only shared when the user explicitly generates and sends a Proof-of-Work Token.
-   **Start Small, Scale Fast:** The MVP will focus exclusively on GitHub for developers. Success here will provide the template for rapidly expanding to other tools and professions (Salesforce for sales, Figma for design, etc.).
-   **Transparency:** Be upfront with users about what data is being collected and how the Work Score is calculated. Trust is our product, and it begins with transparency.
