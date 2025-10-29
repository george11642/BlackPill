# Supabase OAuth Setup for BlackPill

Simple guide to set up social login (Google, GitHub) using Supabase's built-in OAuth providers.

---

## Why Supabase OAuth?

✅ No need to manage OAuth credentials manually
✅ Works seamlessly on Web, iOS, and Android
✅ Automatic token refresh and session management
✅ Integrated with Supabase Auth

---

## Step 1: Enable OAuth Providers in Supabase

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Authentication** → **Providers**
3. Enable the providers you want:
   - **Google** - Enabled
   - **GitHub** - Enabled (optional)
   - Others as needed

---

## Step 2: Configure Google OAuth in Supabase

### Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application** (NOT Android/iOS - let Supabase handle mobile)
6. Add Authorized JavaScript origins:
   ```
   https://YOUR_PROJECT.supabase.co
   https://YOUR_PROJECT.supabase.co/auth/v1/callback
   ```
7. Add Authorized redirect URIs:
   ```
   https://YOUR_PROJECT.supabase.co/auth/v1/callback
   https://localhost:3000/auth/v1/callback
   ```
8. Click **Create**
9. Copy **Client ID** and **Client Secret**

### Add to Supabase

1. In **Authentication** → **Providers** → **Google**
2. Paste:
   - **Client ID**
   - **Client Secret**
3. Click **Save**

---

## Step 3: Configure GitHub OAuth (Optional)

1. Go to **GitHub Settings** → **Developer settings** → **OAuth Apps**
2. Create New OAuth App with:
   - Application name: `BlackPill`
   - Homepage URL: `https://black-pill.app`
   - Authorization callback URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
3. Copy **Client ID** and **Client Secret**
4. In Supabase **Providers** → **GitHub**, paste credentials
5. Click **Save**

---

## Step 4: Mobile App Integration

The mobile app automatically uses Supabase OAuth via the `auth_service.dart`.

### Sign In with Google

```dart
// In mobile/lib/core/services/auth_service.dart
Future<AuthResponse> signInWithGoogle() async {
  final AuthResponse res = await supabase.auth.signInWithOAuth(
    OAuthProvider.google,
    redirectTo: 'io.supabase.flutter://callback', // or your custom deep link
  );
  return res;
}
```

### Sign In with GitHub

```dart
Future<AuthResponse> signInWithGithub() async {
  final AuthResponse res = await supabase.auth.signInWithOAuth(
    OAuthProvider.github,
    redirectTo: 'io.supabase.flutter://callback',
  );
  return res;
}
```

---

## Step 5: Deep Linking Configuration

Update `mobile/lib/config/env_config.dart`:

```dart
deepLinkScheme = const String.fromEnvironment(
  'DEEP_LINK_SCHEME',
  defaultValue: 'blackpill',
);

deepLinkHost = const String.fromEnvironment(
  'DEEP_LINK_HOST',
  defaultValue: 'black-pill.app',
);
```

### Android Deep Linking

In `mobile/android/app/src/main/AndroidManifest.xml`:

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data
    android:scheme="io.supabase.flutter"
    android:host="callback" />
</intent-filter>
```

### iOS Deep Linking

In `mobile/ios/Runner/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLName</key>
    <string>io.supabase.flutter</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>io.supabase.flutter</string>
    </array>
  </dict>
</array>
```

---

## Step 6: Test OAuth Flow

### Test on Web
1. Go to landing page
2. Click "Sign in with Google"
3. Should redirect to Google login
4. After login, should redirect back to app

### Test on Mobile
1. Build and run app
2. Click "Sign in with Google"
3. Should open Google login in browser
4. After login, should deep link back to app

---

## Troubleshooting

**OAuth not working on mobile:**
- Check deep link configuration matches redirect URI
- Ensure Supabase OAuth callback is configured
- Verify package name/bundle ID is correct

**"Invalid redirect_uri" error:**
- Add the exact redirect URI in Google Cloud Console
- Wait 5-10 minutes for changes to propagate
- Try in incognito/private browser

**Sign in works but user not created:**
- Check Supabase Auth logs for errors
- Verify database Row Level Security policies allow inserts
- Check email confirmation settings in Auth

---

## Environment Variables

No additional OAuth env variables needed! Just ensure:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

---

## References

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [GitHub OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-github)
- [Flutter OAuth Plugin](https://pub.dev/packages/supabase_flutter)
