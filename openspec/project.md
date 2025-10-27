# Project Context

## Purpose
AI Job Spot is a high-quality web platform dedicated to aggregating and showcasing the latest job opportunities and insightful articles within the Artificial Intelligence and Machine Learning industry.

## Tech Stack
- **Framework:** Next.js (React)
- **Language:** TypeScript
- **Database:** Firebase Firestore
- **Authentication:** Firebase Authentication
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Project Conventions

### Code Style
- **Formatting:** Code is auto-formatted using Prettier.
- **Linting:** ESLint is used to enforce code quality and catch errors.
- **Naming:** Follows standard TypeScript and React conventions.

### Architecture Patterns
- **Content-as-Code:** All articles and job descriptions are managed as version-controlled Markdown files with YAML frontmatter within the `src/articles/` and `src/job-descriptions/` directories.
- **Data Pipeline:** A sophisticated script (`seedFirestore.ts`) processes the local Markdown files, validates them against Zod schemas, sanitizes the content, and intelligently syncs them with the live Firestore database.
- **Rendering:** The public-facing site heavily utilizes Static Site Generation (SSG) with Incremental Static Regeneration (ISR) for optimal performance and SEO.
- **Security:** Server-side HTML sanitization is enforced using `isomorphic-dompurify` to prevent XSS vulnerabilities from user-generated or admin-managed content.

### Testing Strategy
- **Framework:** Jest is configured for unit and integration tests.
- **Location:** Test files are located in the `__tests__/` directory.

### Git Workflow
- All feature development and bug fixes should be done in separate branches.
- Pull requests are used to merge changes into the main branch after review.
- Commits should follow a conventional format (e.g., `feat:`, `fix:`, `docs:`).

## Domain Context
The platform revolves around two primary content types:
1.  **Job Postings:** Detailed listings for roles in the AI/ML space.
2.  **Articles:** Editorials and briefings on industry trends and topics.
The target audience consists of AI professionals, researchers, and students.

## Important Constraints
- The project currently operates on the Firebase free tier. Firestore database reads and writes are a critical resource to manage to avoid exceeding the daily quota. Caching strategies are employed to mitigate this.

## External Dependencies
- **Firebase:** Provides the core backend infrastructure (database and authentication).
- **Vercel:** Used for hosting, deployment, and managing environment variables.
- **Google Indexing API:** Used to programmatically notify Google of content updates for SEO purposes.