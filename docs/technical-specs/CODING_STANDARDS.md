# AI Job Spot - Coding Standards and Secure Development Guidelines

This document outlines the coding standards and secure development guidelines for the AI Job Spot project. Adherence to these standards is crucial for maintaining code quality, system robustness, and security.

---

## 1. General Principles

*   **Readability & Maintainability:** Write clear, concise, and self-documenting code. Prioritize maintainability over cleverness.
*   **Consistency:** Follow existing project conventions for formatting, naming, and architectural patterns.
*   **Security First:** Always consider security implications at every stage of development. Assume all input is malicious until proven otherwise.
*   **Performance:** Optimize for performance where it matters, but avoid premature optimization.

---

## 2. TypeScript & Type Safety

*   **Strict Mode:** The project operates in TypeScript's strict mode. Leverage it fully.
*   **No `any`:** Avoid the use of the `any` type. If a type is unknown, use `unknown` and narrow it down. If a type is truly dynamic, define an appropriate interface or type alias.
    *   **ESLint Rule:** The `@typescript-eslint/no-explicit-any` ESLint rule is configured as an **error** and must be resolved.
*   **Strong Typing:** Define interfaces or types for all data structures, especially for API request/response bodies, database models, and complex objects.

---

## 3. API Design & Validation

*   **Universal Server-Side Validation:** Every API endpoint that accepts a request body **MUST** use a Zod schema (or equivalent robust validation library) to strictly parse and validate the input.
    *   Reject any non-conforming requests with a `400 Bad Request` error, providing clear validation details.
*   **Secure API Endpoints:** All public-facing API endpoints must implement robust authentication and authorization mechanisms.
    *   **Admin APIs:** Must be protected by Firebase session cookie verification and the `admin: true` custom claim.
    *   **Pipeline APIs:** Must be protected by strong, environment-variable-based API keys.
*   **CSRF Protection:** All API endpoints that modify state (e.g., `POST`, `PUT`, `DELETE`) and are accessed from the frontend **MUST** implement CSRF protection (e.g., using `validateCsrfToken`).
*   **Error Handling:** Implement consistent and informative error handling. Avoid leaking sensitive information in error messages.

---

## 4. Security Best Practices

*   **Secrets Management:**
    *   **NEVER** hardcode secrets (API keys, service account credentials, database passwords) directly in the codebase.
    *   Use environment variables (e.g., `process.env.MY_SECRET`) for all sensitive information.
    *   For Firebase Admin SDK, rely solely on `FIREBASE_SERVICE_ACCOUNT_BASE64` environment variable; no fallback to disk-based key files.
    *   **Git History:** Regularly scan Git history for accidentally committed secrets using tools like `trufflehog`.
*   **Content Security Policy (CSP):** Maintain a strict CSP in `next.config.js`.
    *   **Prohibit `'unsafe-inline'` and `'unsafe-eval'`:** These directives are critical security risks and must be avoided. Refactor inline scripts/styles as necessary.
*   **HTML Sanitization:** All user-generated or external content (e.g., job descriptions, article content) that is rendered on the frontend **MUST** be sanitized on the server-side using a robust library like `isomorphic-dompurify` to prevent XSS vulnerabilities.
*   **Session Management:**
    *   Use `httpOnly`, `secure`, and `SameSite=Lax` attributes for session cookies.
    *   Set reasonable session expiration times.
    *   Implement server-side session invalidation upon logout (e.g., Firebase `revokeRefreshTokens`).
*   **Rate Limiting:** Implement rate limiting on sensitive endpoints (e.g., login forms) to mitigate brute-force attacks.

---

## 5. Development & Build Process

*   **Single Package Manager:** The project uses `npm` as its sole package manager. Ensure `yarn.lock` (or any other lockfile) is not present.
*   **Unified TypeScript Compilation:** Maintain a clear and consistent strategy for TypeScript compilation across the project.
*   **CI/CD Integration:**
    *   **`npm audit`:** Integrate `npm audit --audit-level=high` into the CI/CD pipeline to automatically check for and fail the build on high-severity dependency vulnerabilities.
    *   **SAST:** Integrate a Static Application Security Testing (SAST) tool (e.g., `eslint-plugin-security`) into the CI/CD pipeline to scan for common code vulnerabilities.
    *   **Linting:** Ensure linting runs as part of the CI/CD pipeline and fails the build on errors.

---

## 6. Testing

*   **Test Coverage:** Configure Jest to generate and report on test coverage. Strive for a high coverage threshold.
*   **Targeted Tests:** Write targeted unit and integration tests for critical functionalities, especially security-sensitive areas (e.g., Firestore Security Rules, authentication flows).

---

## 7. Code Hygiene

*   **Unused Variables:** Resolve all ESLint warnings for unused variables. Remove dead code.
*   **Formatting:** Adhere to Prettier formatting rules.

---

By following these guidelines, we aim to build a secure, reliable, and maintainable application.