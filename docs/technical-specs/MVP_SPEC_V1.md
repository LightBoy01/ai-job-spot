# Proof-of-Skill: Verified Portfolio MVP Specification v1.1

**Author:** Gemini (as PM)
**Date:** 2025-11-27
**Status:** APPROVED
**Target Audience:** AI/ML Engineers

---

## 1. Overview & Mission

### 1.1. Product
This document specifies the requirements for the **"Verified Portfolio" MVP**. This is a tool that allows users to create a shareable, cryptographically verified portfolio of their professional accomplishments.

### 1.2. Target Audience (Spearhead Niche)
The exclusive focus for this MVP is **AI & Machine Learning Engineers**.
*   *Why?* This aligns with our existing brand ("AI Job Spot") and traffic.
*   *The Pain:* AI engineers are often judged by generic coding tests that don't measure their ability to train models, curate datasets, or deploy RAG pipelines.

### 1.3. Strategic Goal
The primary goal of this MVP is to solve the "Cold Start Problem" by providing a tool with immense, standalone value to our target niche. We help them prove they are "Real AI Engineers," not just API wrappers.

---

## 2. Core User Experience & Workflow

The user journey is designed to be empowering and curated, not intimidating.

1.  **Onboarding:** A new user signs up (or logs in) to AI Job Spot.
2.  **Connect Sources:** The user is guided to a dashboard where they can connect their **GitHub** account.
3.  **Suggested Claims:** Once connected, the system proactively suggests templated, accomplishment-oriented claims based on their repository data.
    - *Example: "You have contributed to `langchain`. Would you like to add a claim about it?"*
    - *Example: "You have a repository tagged `pytorch` with >50 stars."*
4.  **Curate & Edit:** The user selects a suggested claim, which opens a "Claim Editor." Here, they add their own human context.
    - *Example: "I implemented the new vector store integration in this PR, reducing latency by 20ms."*
5.  **Verification:** The system performs a one-time verification of the claim against the GitHub API.
6.  **Generate Portfolio:** The user's verified claims are compiled into a personal portfolio, accessible via a unique, unguessable, and shareable URL.

---

## 3. Product Requirements & Features

### 3.1. The Portable Portfolio
-   **Shareable URL:** The primary output will be a unique URL (`aijobspot.online/proof/<token>`).
-   **Machine-Readable Data:** The portfolio page must include a prominent link to download a **signed JSON object** of the claims.
-   **Verification Status:** The page displays a "Verified" badge with a timestamp for each claim.

### 3.2. Claim Generation & Management
-   **Template-Driven Suggestions:** The system analyzes GitHub data to find:
    -   Contributions to popular AI repositories (by stars/forks).
    -   Repositories with AI-specific tags (`machine-learning`, `deep-learning`, `nlp`, `cv`).
    -   Languages used (Python, C++, CUDA).
-   **Claim Editor:** Rich text editor for adding context.

### 3.3. Authentication & Security
-   **Primary Auth:** "Sign in with GitHub" (Critical for data access).
-   **Token Security:** All OAuth tokens are encrypted at rest using `src/lib/encryption.ts` and never exposed to the client.

---

## 4. Technical Architecture & Principles

### 4.1. Core Stack
-   **Frontend:** Next.js, React, Tailwind CSS (Existing)
-   **Backend:** Next.js API Routes (Existing)
-   **Database:** Firebase Firestore (Existing)

### 4.2. "Stateless & Ephemeral" Verification Principle
This is the core security and trust principle.
1.  When verification is requested, the user's OAuth token is retrieved and used **in-memory**.
2.  The service queries the GitHub API.
3.  The service confirms the claim's validity.
4.  The backend stores **only the verified claim text and metadata** in Firestore.
5.  The OAuth token is **discarded** (or encrypted if needed for background refreshes, but preferably discarded for V1).

---

## 5. Tier 1 Data Source Integrations (MVP v1.0)

The MVP will launch with support for **GitHub** exclusively, but with deep filtering for AI relevance.

1.  **GitHub:**
    -   **Authentication:** GitHub OAuth (read-only permissions).
    -   **Data to Verify:**
        -   **Repo Ownership:** "Maintains repo `X` with `Y` stars."
        -   **Contribution:** "Merged PRs into `tensorflow` or `huggingface/transformers`."
        -   **Topic Analysis:** "Has 5 repos tagged `computer-vision`."

---

## 6. Explicitly Out of Scope for MVP v1.0

-   **Employer-facing features:** No job board integration, candidate search, or employer dashboards.
-   **Web3 Sources:** Etherscan, Snapshot (Deferred to V2).
-   **Live Re-verification:** The portfolio page will show cached verification results.
-   **True Zero-Knowledge Proofs (ZKP).**
-   **A "Skill Score" or any other form of automated rating.**