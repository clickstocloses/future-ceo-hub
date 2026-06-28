## Fix: Reset password button stuck on "Updating..."

**Root cause:** `supabase.auth.updateUser({ password })` is hanging with no response and no error, so `finally` never runs and the button stays on "Updating...". The URL in the screenshot is `/reset-password#` (empty hash) — the recovery tokens were already consumed on a prior page load, so the current session is either stale or not a true recovery session, and the update call sits forever waiting on the network.

**Changes (all in `src/pages/ResetPasswordPage.tsx`):**

1. **Add a hard timeout around `updateUser`** (10s). If it doesn't resolve, throw a clear error ("Request timed out — please request a new reset link") so the button always returns to "Update Password" instead of being stuck.
2. **Re-validate session right before submit.** Call `supabase.auth.getUser()` first; if it fails or returns no user, show inline error "Your reset link has expired. Request a new one." and flip status to `invalid` so the form disables and the user is pointed at the login page link.
3. **Guarantee `loading` resets.** Keep the `try/catch/finally` but also set `loading = false` immediately on success (before the success panel swap) so there is no frame where the button can read "Updating..." after completion.
4. **Surface low-level errors inline.** Any thrown error from `updateUser` (including the timeout) is shown in the existing red error banner above the form, in addition to the toast.
5. **On success, navigate is user-driven only** (existing "Go to Dashboard" button) — no auto-redirect that could race the state update.

No other files, no backend, no auth config changes.
