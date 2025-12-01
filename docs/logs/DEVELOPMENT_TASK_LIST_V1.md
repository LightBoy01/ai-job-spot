# Verified Portfolio: Development Task List v1.1 (Final)

**Source Document:** `MVP_SPEC_V1.md`
**Status:** Ready for Development

This document breaks down the MVP specification into a concrete, actionable list of development tasks, organized by epic. This version has been refined with feedback to include testing and improve task dependencies.

---

### Epic 1: Project Setup & Core Infrastructure

*   [ ] **Task:** Create a new feature branch in Git: `feature/verified-portfolio`.
*   [ ] **Task:** Define and document the Firestore data models for `userIntegrations` and `userClaims`.
*   [ ] **Task:** Set up secure secret management in the Vercel/Firebase environment for the server-side signing key and external API (GitHub) credentials.
*   [ ] **Task:** Create initial, empty Next.js pages for the new dashboard, claim editor, and public portfolio routes.
*   [ ] **Task (Testing):** Configure Jest and React Testing Library for the project.

---

### Epic 2: User Authentication & Onboarding

*   [ ] **Task:** Implement the GitHub OAuth2 flow for both user sign-in (`Sign in with GitHub`) and for authorizing access to repository data.
*   [ ] **Task:** Build the backend API endpoint to handle the GitHub OAuth callback, encrypt, and store the user's token in the `userIntegrations` collection.
*   [ ] **Task:** Create the main user dashboard UI, which will display a list of connected "Work Wallets."
*   [ ] **Task:** Build the UI component for connecting a new "Work Wallet," starting with GitHub.
*   [ ] **Task (Testing):** Write unit tests for the OAuth callback handler.
*   [ ] **Task (Testing):** Write component tests for the "Work Wallet" connection UI.

---

### Epic 3: Backend - Verification & Claim Engine

*   [ ] **Task:** **Define and document the API schemas/contracts** for all new endpoints (`/api/claims`, `/api/portfolio/json`, etc.).
*   [ ] **Task:** Create the API endpoint (`POST /api/claims`) for creating and saving a new, verified claim to the `userClaims` collection.
*   [ ] **Task:** Create the API endpoint (`PUT /api/claims/{claimId}`) for updating the user's narrative on an existing claim.
*   [ ] **Task:** Implement the core "Stateless & Ephemeral" verification service. This service will take a claim and a user's token (in-memory) and return a boolean verification result.
*   [ ] **Task:** Develop the first version of the **Claim Suggestion Engine** for GitHub.
    -   *Heuristic 1:* Suggest claims for the user's top 5 repositories by star count.
    -   *Heuristic 2:* Suggest claims for the user's top 3 repositories by recent commit activity.
*   [ ] **Task:** Implement the server-side signing logic for the JSON portfolio. Create an endpoint (`GET /api/portfolio/json`) that returns the user's claims as a signed JSON object.
*   [ ] **Task (Testing):** Write unit tests for the verification service and the claim suggestion heuristics.
*   [ ] **Task (Testing):** Write integration tests for the API claim endpoints.

---

### Epic 4: Backend - Data Source Integration (Tier 1)

*   [ ] **Task:** Build the integration service to fetch and process data from the Etherscan API using a public wallet address.
*   [ ] **Task:** Build the integration service to fetch and process proposal/voting data from the Snapshot.org API using a public wallet address or ENS name.
*   [ ] **Task:** Extend the "Work Wallet" connection UI to support adding an Ethereum address.
*   [ ] **Task:** Extend the Claim Suggestion Engine to suggest claims based on Etherscan/Snapshot data (e.g., "Deployed X contracts," "Voted on Y proposals").
*   [ ] **Task (Testing):** Write integration tests for the Etherscan and Snapshot.org data fetching services.

---

### Epic 5: Frontend - Portfolio & Claim Management

*   [ ] **Task:** Develop the dynamic, public-facing portfolio page at `/proof/[token]`. This page will fetch and render a user's verified claims.
*   [ ] **Task:** Build the "Claim Editor" UI component, allowing users to add their narrative to suggested claims.
*   [ ] **Task:** Implement the UI for the dashboard that displays suggested claims and allows the user to accept or reject them.
*   [ ] **Task:** Design and implement the clear UI state for users who have no verifiable activity on a connected source.
*   [ ] **Task:** Add the "Download Signed JSON" button to the public portfolio page, which links to the corresponding API endpoint.
*   [ ] **Task (Testing):** Write component tests for the public portfolio page and the "Claim Editor" UI.

