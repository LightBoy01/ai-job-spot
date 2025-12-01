# Social Media Automation Plan

## 1. Objective

To expand the reach of the AI Job Spot platform by automatically posting new job opportunities to various social media channels. This will drive targeted traffic back to our job board, increase brand visibility, and attract more "job hunters."

This document outlines a phased approach, starting with a Proof of Concept for Twitter (X).

---

## 2. Phased Rollout

### Phase 1: Twitter (X) Integration - Proof of Concept

This phase focuses on building a robust and secure script to post new jobs to Twitter.

**Trackable Tasks:**

*   [x] **1.1: Project Setup & Configuration**
    *   [x] **1.1.1:** Create a Twitter Developer Account and a new App with "Read & Write" permissions.
    *   [x] **1.1.2:** Generate `API Key`, `API Key Secret`, `Access Token`, and `Access Token Secret`.
    *   [x] **1.1.3:** Securely store these credentials in `.env.local` and Vercel environment variables. **DO NOT** commit them to Git.

*   [x] **1.2: Core Script Development**
    *   [x] **1.2.1:** Install a suitable Twitter API v2 client library (e.g., `twitter-api-v2`).
    *   [x] **1.2.2:** Create a new script file: `scripts/social/post-to-twitter.ts`.
    *   [x] **1.2.3:** Implement authentication logic to connect to the Twitter API.
    *   [x] **1.2.4:** Implement a function to fetch one unpublished job from Firestore. This requires adding a tracking field like `socialsPosted.twitter` to our job documents.
    *   [x] **1.2.5:** Implement a function to format the job data into the agreed-upon two-tweet thread format, including dynamic hashtags.
    *   [x] **1.2.6:** Implement the core function to post the thread to Twitter.
    *   [x] **1.2.7:** Implement logic to update the job's `socialsPosted.twitter` field in Firestore upon successful posting.

*   [x] **1.3: Testing & Verification**
    *   [x] **1.3.1:** Implement a "dry run" mode in the script that logs the formatted tweets to the console without posting.
    *   [x] **1.3.2:** Manually test the script in "dry run" mode to verify output.
    *   [x] **1.3.3:** Manually test the script in "live" mode to post a test job.
    *   [x] **1.3.4:** Verify the post appears correctly on Twitter and the Firestore document is updated.

**Phase 1 Summary:** The proof of concept is complete. The script can successfully connect to Twitter, fetch a job, post it as a thread, and update the database. A persistent issue with a complex Firestore query (`where` + `orderBy`) was identified, which requires a composite index. While the index was created, it did not resolve the issue immediately. The live test was completed using a simplified query. The script is currently functional but uses a less efficient query until the index issue is fully resolved.

### Phase 2: Automation & Scheduling

*   [x] **2.1:** Configure a GitHub Action to run the Twitter script on a recurring schedule (e.g., every 4 hours).

### Phase 3: Expansion to Other Platforms (Future)

*   [ ] **3.1:** Plan and develop a content transformation pipeline to generate simple videos for YouTube Shorts & TikTok.
*   [ ] **3.2:** Plan and develop a content transformation pipeline to generate branded images for Pinterest.
*   [ ] **3.3:** Adapt the core posting logic for each new platform's API.

### Phase 4: Future Enhancements

*   [ ] **4.1: Enhance the "Hook"**
    *   [ ] **4.1.1: Smarter Hashtags:** Analyze job titles/descriptions to extract more specific and relevant hashtags (e.g., #PyTorch, #NLP).
    *   [ ] **4.1.2: @-Mention Companies:** Add a `companyTwitterHandle` field to job data and include it in tweets to notify companies and increase reach.
    *   [ ] **4.1.3: Auto-Generated Images:** Create a system to generate a unique, branded image for each job post, including the title and company logo.

*   [ ] **4.2: Evolve the Strategy**
    *   [ ] **4.2.1: Expand to LinkedIn:** Adapt the script and content style for posting jobs to LinkedIn, the primary professional network.
    *   [ ] **4.2.2: Automate Article Posting:** Create a parallel workflow to share the site's articles on social media, providing more value to followers.
    *   [ ] **4.2.3: Implement a Reposting Strategy:** Develop a "Job of the Day" or "ICYMI" feature to repost high-quality, open positions to reach a wider audience over time.

---

## 3. Red Teaming & Risk Analysis

This section identifies potential vulnerabilities and outlines mitigation strategies.

| Risk Category | Vulnerability | Mitigation Strategy |
| :--- | :--- | :--- |
| **Security** | **Leaked Credentials:** API keys and secrets are accidentally committed to the Git repository. | **1.** Use `.env.local` for local development. <br> **2.** Ensure `.env.local` is in `.gitignore`. <br> **3.** Use Vercel's encrypted environment variables for production/automated workflows. |
| **Operational** | **API Rate Limiting / Spam Flagging:** Posting too frequently or too many jobs at once gets the account restricted. | **1.** The script will be designed to post only **one** job per execution. <br> **2.** The automation scheduler (Phase 2) will be set to a conservative interval (e.g., once every 4-6 hours). |
| **Data Quality** | **Poorly Formatted Posts:** A job with missing data (e.g., no salary) or overly long text creates a broken or unprofessional tweet. | **1.** The script will validate job data against our Zod schemas before processing. <br> **2.** Implement graceful truncation and fallback values for missing/long fields. <br> **3.** The "dry run" mode is essential for pre-flight checks. |
| **Reputation** | **Erroneous Posts:** A bug in the script posts incorrect information, duplicate jobs, or fails silently. | **1.** Thoroughly test with the "dry run" and manual posting steps. <br> **2.** The script will update a `socialsPosted.twitter` flag in Firestore to prevent duplicate posts. <br> **3.** Implement robust error handling and logging to catch and diagnose failures. |
| **Dependency** | **Twitter API Changes:** Twitter deprecates or changes the API endpoints we rely on, breaking the script. | **1.** Use a well-maintained, popular API client library to abstract away minor API changes. <br> **2.** Implement monitoring to alert us if the script starts failing consistently. |
