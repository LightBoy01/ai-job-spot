# Project Review & Strategic Pivot Plan v1.0

**Author:** Gemini
**Date:** 2025-11-27
**Status:** Adopted

---

## 1. Overview

This document outlines the results of a comprehensive project review following the adoption of the "Proof of Skill V2" vision. It assesses the current state of the application and defines the necessary strategic pivot required to align our development efforts with the new long-term goal.

**High-Level Summary:** The current application is a well-architected content platform (job board and article CMS). However, the new V2 vision transforms our business from a "content destination" into a "user-centric utility." This requires a decisive pivot in development focus, moving away from improving the existing platform and dedicating all resources to building the new "Verified Portfolio" MVP.

---

## 2. Analysis of Existing Application Components

### 2.1. Public Job & Article Sections (`/`, `/jobs`, `/articles`)
-   **Current State:** These pages are the application's core, designed for users to consume content.
-   **V2 Alignment:** These sections become secondary. The primary user acquisition channel will shift from "viewing jobs" to "creating a portfolio." The article section remains a key content marketing asset to attract our spearhead niche.
-   **Strategic Decision:**
    -   **De-emphasize:** The homepage's primary call-to-action must be refocused on "Create Your Verified Portfolio."
    -   **Freeze Development:** All new feature work on the public-facing job board (e.g., advanced search, filtering) is to be frozen. The existing functionality is sufficient for the foreseeable future.

### 2.2. Admin Panel (`/admin/*`)
-   **Current State:** A functional, internal CMS for the manual creation and management of job and article content.
-   **V2 Alignment:** This entire module is philosophically misaligned with the new vision, which prioritizes user-generated, verifiable claims over manually created content.
-   **Strategic Decision:**
    -   **Deprecate (Long-term):** This internal CMS is now considered legacy. The long-term plan is to deprecate and remove it as the "Verified Claims" model matures.
    -   **Maintain, Do Not Invest (Immediate):** The admin panel will be kept functional to manage existing content, but all new feature development on this tool must cease immediately.

---

## 3. Path Forward: The "Verified Portfolio" MVP

Our development resources must be fully re-allocated to the new core product.

### 3.1. Priority Development
-   **Focus:** Execute exclusively on the tasks defined in **`docs/DEVELOPMENT_TASK_LIST_V1.1 (Final).md`**.
-   **Core Deliverables:**
    1.  A new **User Dashboard (`/dashboard`)** for connecting "Work Wallets."
    2.  A new **Claim Editor UI** for curating and annotating accomplishments.
    3.  The public-facing **Portfolio Page (`/proof/[token]`)**, which is the central product of the MVP.

### 3.2. Data & Architecture
-   **Current Model:** Centered on `articles` and `jobs` collections in Firestore.
-   **New Model:** We will design and implement two new primary collections:
    1.  `userIntegrations`: To securely handle data related to connected third-party accounts.
    2.  `userClaims`: To store the user-generated, verified claims.
-   **Co-existence:** The existing `jobs` and `articles` tables will remain but will be architecturally separate from the new "Proof of Skill" feature set.

---

## 4. Conclusion

The AI Job Spot project is pivoting from a "publication" model to a "software tool" model. This requires disciplined focus. By freezing development on legacy features and dedicating our efforts to the "Verified Portfolio" MVP, we align our work with the new, more robust V2 vision.

Implementation will commence as soon as the environmental blockers (Firebase configuration and resource quotas) are resolved.
