# Strategic Implementation Roadmap

This document tracks the implementation of the strategic models for enhancing AI Job Spot.

---

## 1. The Provenance Model (Simplicity & Trust)

**Core Initiative:** The "Content Provenance Initiative." We will treat every piece of content as an asset with a verifiable history.

### Implementation Checklist

- [x] **Phase 1: Proof of Concept**
  - [x] **Task 1.1:** Manually implement a hard-coded "Provenance Trail" on a single job detail page.
    - [x] Choose a target job posting.
    - [x] Design a simple, elegant UI for the trail.
    - [x] Add the UI to the `src/pages/jobs/[id].tsx` component.
  - [ ] **Task 1.2:** Gather user feedback/data on the feature.

- [ ] **Phase 2: Backend & Schema**
  - [ ] **Task 2.1:** Update Firestore schema for `jobs` and `articles` to include provenance fields (e.g., `source`, `verificationDate`, `sourceUrl`, `authorNotes`).
  - [ ] **Task 2.2:** Refactor the `seedFirestore.ts` script to include this new data.

- [x] **Phase 3: Dynamic Implementation**
  - [x] **Task 3.1:** Update the `[id].tsx` and `[slug].tsx` pages to dynamically render the Provenance Trail from Firestore data.
  - [ ] **Task 3.2:** Integrate provenance fields into the Admin Panel for manual entry and updates.

---

## 2. The Horology Model (Classical & Luxurious Look)

**Core Initiative:** The "UI Complication Audit." We will treat every UI element as a "complication" that must justify its existence through purposeful and elegant execution.

### Implementation Checklist

- [x] **Phase 1: Key Complications**
  - [x] **Task 1.1:** Redesign the "Post a Job" button as a primary "complication" and add it to the main navigation bar.
    - [x] Design a "crown-like" visual treatment.
    - [x] Add the button to `src/components/Navbar.tsx`.
  - [x] **Task 1.1a:** Implement public-facing "Post a Job" workflow to resolve UX conflict and build trust.
    - [x] Create public submission page `/post-a-job`.
    - [x] Create secure API endpoint `/api/jobs/public-post` to handle submissions.
    - [x] Verify submissions are correctly routed to the admin review queue.
  - [ ] **Task 1.2:** Refine the visual hierarchy and spacing on the homepage (`index.tsx`).
  - [ ] **Task 1.3:** Design the UI for the "Provenance Trail" (synergy with Provenance Model).

- [ ] **Phase 2: Secondary Complications**
  - [ ] **Task 2.1:** Audit and refine filter/search options.
  - [ ] **Task 2.2:** Improve table and form styling in the Admin Panel for a more "crafted" feel.

- [ ] **Phase 3: Polishing**
  - [ ] **Task 3.1:** Review and refine all hover/focus states for subtlety and smoothness.
  - [ ] **Task 3.2:** Audit iconography for consistency and elegance.
