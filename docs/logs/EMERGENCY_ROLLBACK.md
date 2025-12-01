# Emergency "Git as Backup" Restore Procedure

**Objective:** This document provides the steps to completely restore the website's content (Jobs, Articles, and Sources) from the version-controlled files in the Git repository.

**Strategy:** This project uses a "content-as-code" philosophy. The Git repository is the single source of truth. The Firestore database is treated as a serving layer or cache. A restore operation involves wiping the database and rebuilding it from the local files using the seed script.

---

### **Prerequisites**

1.  A clean, up-to-date clone of the Git repository.
2.  A working local development environment with Node.js and all dependencies installed (`npm install`).
3.  A valid Firebase service account key file (e.g., `ai-jobs-spot-92a1f1a8b08e.json`) in the project root, as required by the seed script.

---

### **Restore Process**

#### **Step 1: (If Needed) Manually Restore Admin User**

This process does **not** restore Firebase Authentication users. If admin accounts are lost, they must be recreated manually.

1.  Go to the [Firebase Console > Authentication](https://console.firebase.google.com/project/_/authentication/users).
2.  Add a new user with the desired admin email and a temporary password.
3.  You will need to grant this user admin privileges using the `setAdminClaim.js` script.

#### **Step 2: Wipe Existing Database Content (Optional but Recommended)**

To ensure a clean slate, it's best to delete the existing collections. You can do this manually in the Firebase Console by deleting the `jobs`, `articles`, and `sources` collections.

#### **Step 3: Run the Seed Script**

This single command will read all content from the local Markdown files (`src/articles`, `src/job-descriptions`) and the JSON config (`src/config/sources.json`) and use it to completely rebuild the Firestore database.

1.  Open your terminal in the project root.
2.  Run the seed command:
    ```bash
    npm run seed
    ```

---

### **Step 4: Verify**

1.  Monitor the script's output in the terminal. It will log its progress for seeding sources, jobs, and articles.
2.  Once complete, inspect the Firestore database in the console to confirm the `jobs`, `articles`, and `sources` collections have been repopulated.
3.  Visit the live website. The content should now reflect the state of your Git repository.