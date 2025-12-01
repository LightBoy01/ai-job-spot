# Project Plan: The Authenticity Engine (v1.1)

This document outlines the plan to build the core "Proof of Work" and job verification system for AI Job Spot. This engine is the foundation of our strategic moat. This plan is based on the initial proposal and has been revised to incorporate findings from a Red Team analysis.

## Guiding Principles
- **Build Incrementally:** Each phase should deliver a functional piece of the system.
- **Automate Where Possible:** Use automation to support, not replace, human judgment.
- **Clarity & Respect:** All communication with employers must be clear, respectful, and build our reputation.

---

## Phase 0: Seeding the Engine (The "Cold Start" Solution)

*   **Goal:** Overcome the initial value proposition challenge by manually recruiting the first cohort of high-quality employers.
*   **Tasks:**
    *   [ ] **Identify Targets:** Curate a list of 20-30 desirable, high-signal companies in the AI space that are currently hiring.
    *   [ ] **Personal Outreach:** Craft a personalized outreach email explaining our vision for a high-quality, curated job board.
    *   [ ] **Offer "White-Glove" Onboarding:** Offer to personally help the first 10-15 companies craft and post their first "Featured" job for free, in exchange for their participation and feedback.

---

## Phase 1: The Submission & Review Backend

*   **Goal:** Create the internal plumbing for a human-in-the-loop verification system.
*   **Tasks:**
    *   [x] **Solidify API Endpoint:** Ensure `/api/jobs/post` saves all submissions with `status: 'pending_review'`.
    *   [x] **Build Review UI:** Enhance the Admin Panel with a "Pending Jobs" view.
        *   [x] Display all fields for a pending job.
        *   [x] Include clear "Approve" and "Reject" buttons.
    *   [x] **Implement Core Logic:**
        *   [x] "Approve" button changes status to `'published'` and sets `isFeatured: true`.
        *   [x] "Reject" button changes status to `'rejected'`.
    *   [x] **Design Communication Templates:**
        *   [x] Draft the email for "Submission Received."
        *   [x] Draft the email for "Your Job has been Approved."
        *   [x] Draft a respectful, helpful email for "Submission Rejected," explaining our quality guidelines and inviting a revision.

---

## Phase 2: Defining & Implementing the "Proof of Work" (v1)

*   **Goal:** Define a more objective initial "work" criterion and build the public-facing submission form.
*   **Tasks:**
    *   [x] **Define Objective Criteria:** The initial "Proof of Work" is defined as:
        *   1. The "Human Context Q&A" (`story_answer1`) field must be filled out.
        *   2. The answer must be a minimum of 200 characters.
        *   3. The answer must not contain more than one hyperlink.
    *   [x] **Build `/post-a-job` Page:**
        *   [x] Create the public-facing form with all necessary fields.
        *   [x] Clearly label the "Human Context" field as required.
        *   [x] Add helper text explaining the requirement and its benefit (e.g., "Help our community understand your team's vision. A minimum of 200 characters is required to ensure quality.").
    *   [x] **Integrate Frontend and Backend:** Connect the form to the `/api/jobs/post` endpoint.

---

## Phase 3: The "Status Badge"

*   **Goal:** Visually signal the status of a verified job to the public.
*   **Tasks:**
    *   [x] **Create "Featured" Badge Component:** Design and build the visual badge/indicator.
    *   [x] **Conditional Rendering:** Update the `JobCard` and job details page to display the "Featured" badge and apply premium styling if a job has `isFeatured: true`.

---

## Phase 4: Measuring Success (KPIs)

*   **Goal:** Define and establish a baseline for key performance indicators.
*   **Tasks:**
    *   [x] **Implement Tracking:** Set up analytics or database queries to track:
        *   [x] Weekly job submissions.
        *   [x] Approval / Rejection rate.
        *   [ ] Average time from submission to decision.
        *   [ ] (Future) Click-through rate on "Featured" vs. "Aggregated" jobs.

---

## Future Vision: Phase 5 - The Triage Layer (v2)

*   **Goal:** Address the long-term scalability of the manual review process. This phase will be planned in detail after v1 is operational.
*   **Scope:**
    *   [ ] Design an automated heuristics engine to pre-filter submissions and assign a "suspicion score."
    *   [ ] Potential heuristics: keyword spam check, company domain analysis, plagiarism detection.