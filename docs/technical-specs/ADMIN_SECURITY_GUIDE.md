# Admin Security Guide: Enforcing Multi-Factor Authentication (MFA)

This guide provides the necessary steps to secure your admin account for the AI Job Spot application. As identified in our security review, the single most critical step is to protect the human administrator account.

## Why is this important?

All of the application's security measures are irrelevant if an attacker gains access to your admin credentials. Enforcing MFA makes it exponentially harder for an attacker to take over your account, even if they manage to steal your password.

## How to Enable MFA for Your Google Account

The admin access is tied to a Google account that has been granted `admin` privileges. You must enable 2-Step Verification (Google's term for MFA) on that specific Google account.

**Step 1: Go to the Google 2-Step Verification Page**

Open your browser and navigate to this URL:
[https://myaccount.google.com/security/signinoptions/two-step-verification](https://myaccount.google.com/security/signinoptions/two-step-verification)

**Step 2: Follow the On-Screen Instructions**

Google provides a user-friendly wizard to guide you through the process. You will be asked to:
1.  Sign in to your Google Account.
2.  Choose your preferred second verification step. The most common and secure options are:
    *   **Google Prompts (Recommended):** Receive a push notification on your trusted smartphone.
    *   **Authenticator App:** Use an app like Google Authenticator, Authy, or 1Password to generate a time-based code.
    *   **Security Key:** Use a physical hardware key (like a YubiKey) for the highest level of security.
3.  Provide a backup option in case you lose access to your primary method.

**Step 3: Confirm Activation**

Once you complete the setup, 2-Step Verification will be active. The next time you sign into Firebase or any Google service with this account, you will be required to provide your password and your second factor.

---

**Please confirm once you have completed this step.** The security of the entire platform depends on it.
