# AI Career Trajectory Simulator: Project Plan

## 1. Project Objective

To develop a free, high-utility "AI Career Trajectory Simulator" tool that acts as a traffic magnet, attracting new users and encouraging repeat visits. This tool will enhance AI Job Spot's authority and create a sustainable growth flywheel by providing tangible value beyond job listings.

---

## 2. Phased Development Plan

### **Phase 1: Discovery & MVP Definition (Target: Weeks 1-2)**

*The goal of this phase is to validate core assumptions and define the simplest possible version of the tool that is still genuinely useful.*

- **1.1: Market & Data Feasibility Analysis:**
  - **Action:** Perform keyword research to identify user search intent for AI career paths.
  - **Action:** Analyze the existing Firestore job data to determine viable data points for inferring career paths (e.g., `title`, `tags`, `jobLevel`).
  - **Action:** Manually research 50-100 LinkedIn profiles to create a small, data-backed "career graph" for the MVP.

- **1.2: Define MVP Scope & User Flow:**
  - **Action:** Finalize the user flow:
    1. User selects a **current role** from a curated list.
    2. The tool displays 2-3 potential **"Next Step" roles**.
    3. For each "Next Step," it shows:
        - A list of **"Common Skills"** for the role.
        - A list of relevant **live job postings**.
        - A list of relevant **articles**.

- **1.3: Outline Technical Architecture:**
  - **Action:** Plan the frontend page (`/pages/tools/career-simulator.tsx`).
  - **Action:** Plan the backend API (`/pages/api/tools/career-simulator.ts`) and its caching strategy.

### **Phase 2: MVP Development (Target: Weeks 3-5)**

*The goal is to build the core, functional tool as defined in Phase 1.*

- **2.1: Backend API Development:**
  - **Action:** Build the API endpoint and the hardcoded MVP career graph logic.
  - **Action:** Implement data fetching and skill analysis functions.
  - **Action:** Implement a server-side caching mechanism for the API response.

- **2.2: Frontend UI/UX Development:**
  - **Action:** Build the React components for the user interface.
  - **Action:** Integrate the UI with the backend API, including loading/error states.

- **2.3: Testing & Refinement:**
  - **Action:** Conduct thorough manual end-to-end testing.
  - **Action:** Ensure the tool is fully responsive for mobile devices.

### **Phase 3: Launch & Promotion (Target: Week 6)**

*The goal is to launch the tool and begin generating the traffic flywheel.*

- **3.1: Pre-Launch SEO & Content:**
  - **Action:** Write SEO-optimized `title` and `meta description` for the tool's page.
  - **Action:** Write a comprehensive blog post announcing the tool.

- **3.2: Launch & Initial Push:**
  - **Action:** Deploy the feature to production.
  - **Action:** Announce the launch on all social media channels.
  - **Action:** Share the tool authentically in relevant online communities (e.g., Hacker News, Reddit).

- **3.3: Strategic Outreach:**
  - **Action:** Curate a list of high-value contacts (universities, bootcamps, bloggers).
  - **Action:** Send personalized outreach emails suggesting the tool as a resource.

### **Phase 4: Iteration & Expansion (Ongoing)**

*The goal is to enhance the tool based on user feedback and data.*

- **4.1: Gather Feedback & Analyze Usage:**
  - **Action:** Implement a simple feedback mechanism on the tool's page.
  - **Action:** Use web analytics to track usage patterns.

- **4.2: Evolve the Tool:**
  - **Action:** Add new features to the "Post-MVP v2" backlog based on feedback (e.g., data visualizations, more personalization, dynamic career graph).

---

## 3. Project Governance & Review Process

### **File Protocol**

We will adhere to a strict protocol of checking files before and after any edit or creation to ensure accuracy and integrity of the codebase.

### **Phase-End Review Template**

*At the completion of each phase, we will fill out the following template to ensure we are learning and improving throughout the project lifecycle.*

---
**Phase [Number] Review: [Phase Name]**

- **Date:** `[YYYY-MM-DD]`
- **Status:** `[Completed / In Progress / Blocked]`

**Summary of Actions:**
- *[Briefly list the actions completed in this phase.]*

**Review of Actions & Code:**
- **Good (What to continue):**
  - *[Note on successful strategies, clean code implementations, effective decisions.]*
- **Weak (What to improve):**
  - *[Note on inefficient processes, code that needs refactoring, poor decisions.]*
- **Missing (What to add):**
  - *[Note on overlooked steps, missing tests, features that should have been included.]*

**Lessons Learned:**
- *[What was the key takeaway from this phase?]*

**Next Steps:**
- *[Outline the immediate actions for the start of the next phase.]*
---
