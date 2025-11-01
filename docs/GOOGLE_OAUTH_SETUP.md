# Google OAuth Setup for BlackPill

> **✅ UPDATED: We now use Supabase OAuth instead of native Google Sign-In!**
> 
> This simplifies setup significantly - no Android/iOS client IDs needed!
> 
> **See [SUPABASE_OAUTH_SETUP.md](./SUPABASE_OAUTH_SETUP.md) for the current setup guide.**

---

## Legacy Information (For Reference Only)

The following information is kept for historical reference. The current implementation uses Supabase OAuth, which does **not** require the steps below.

### Old Native Google Sign-In Setup (DEPRECATED)

Previously, we used the `google_sign_in` package which required:
- Android OAuth client ID with SHA-1 fingerprint
- iOS OAuth client ID with Bundle ID and Team ID
- Environment variables: `GOOGLE_CLIENT_ID_ANDROID` and `GOOGLE_CLIENT_ID_IOS`

**This approach is no longer used.** We've switched to Supabase OAuth which only requires:
1. Web OAuth client ID configured in Google Cloud Console
2. Client ID and Secret added to Supabase Dashboard
3. No mobile-specific configuration needed!

---

## Current Setup (Supabase OAuth)

**Quick Start:**

1. Follow [SUPABASE_OAUTH_SETUP.md](./SUPABASE_OAUTH_SETUP.md)
2. Create **Web application** OAuth client ID in Google Cloud Console
3. Add credentials to Supabase Dashboard → Authentication → Providers → Google
4. Done! Works on iOS, Android, and Web automatically.

**Benefits:**
- ✅ No Android SHA-1 fingerprint needed
- ✅ No iOS Bundle ID/Team ID configuration needed
- ✅ No environment variables for client IDs
- ✅ Single OAuth configuration works for all platforms
- ✅ Automatic token refresh and session management
- ✅ Simpler codebase (removed `google_sign_in` dependency)

---

## Migration Notes

If you're upgrading from the old native Google Sign-In:

1. **Remove** `google_sign_in` dependency from `pubspec.yaml`
2. **Remove** `GOOGLE_CLIENT_ID_ANDROID` and `GOOGLE_CLIENT_ID_IOS` from `.env`
3. **Update** `auth_service.dart` to use `signInWithOAuth` (already done)
4. **Configure** Supabase OAuth per [SUPABASE_OAUTH_SETUP.md](./SUPABASE_OAUTH_SETUP.md)

---

## References

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Setup via Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase OAuth Setup Guide](./SUPABASE_OAUTH_SETUP.md) ← **Current guide**