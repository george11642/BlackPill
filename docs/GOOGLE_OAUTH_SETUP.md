# Google OAuth Setup for BlackPill

Complete guide to set up Google Sign-In for Android and iOS apps.

---

## Prerequisites

- Google Cloud Project already created (from deployment checklist)
- Android package name: `com.black-pill.app`
- iOS bundle ID: `com.black-pill.app`

---

## Step 1: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your BlackPill project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Choose **External** as User Type (for production apps)
5. Fill in:
   - **App name:** BlackPill
   - **User support email:** support@black-pill.app
   - **Developer contact:** your-email@gmail.com
6. Click **Save and Continue**
7. On Scopes page, click **Save and Continue** (default scopes are fine)
8. On Test users page, add your test email accounts if needed
9. Click **Save and Continue** → **Back to Dashboard**

---

## Step 2: Get Android SHA-1 Fingerprint

### For Debug Keystore (Testing)

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

On Windows:
```powershell
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Output example:**
```
Certificate fingerprints:
     SHA1: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD
```

Copy the SHA1 fingerprint (without colons): `AABBCCDDEEFF00112233445566778899AABBCCDD`

### For Release Keystore (Production)

After you create your release keystore:
```bash
keytool -list -v -keystore release.keystore -alias blackpill
```

---

## Step 3: Create Android OAuth Client ID

1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Android** as Application type
4. Fill in:
   - **Package name:** `com.black-pill.app`
   - **SHA-1 certificate fingerprint:** (paste from Step 2)
5. Click **Create**
6. Copy the **Client ID** (looks like: `123456789-abcdef.apps.googleusercontent.com`)
7. Click **OK**

**Save as:** `GOOGLE_CLIENT_ID_ANDROID`

---

## Step 4: Get iOS App ID and Team ID

You need your Apple Developer account for iOS:

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Go to **Certificates, Identifiers & Profiles** → **Identifiers**
3. Find or create an App ID with Bundle ID: `com.black-pill.app`
4. Get your **Team ID** from Account menu (top right) → **Membership**
5. Format your iOS Client ID request as: `YOUR_TEAM_ID.com.black-pill.app`

---

## Step 5: Create iOS OAuth Client ID

1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **iOS** as Application type
4. Fill in:
   - **Bundle ID:** `com.black-pill.app`
   - **Team ID:** (from Apple Developer account)
   - **App ID:** (from Apple Developer account)
5. Click **Create**
6. Copy the **Client ID**

**Save as:** `GOOGLE_CLIENT_ID_IOS`

---

## Step 6: Update Mobile Environment Variables

Update `mobile/env.example` and `.env`:

```env
GOOGLE_CLIENT_ID_ANDROID=YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_ID_IOS=YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
```

Update `mobile/lib/config/env_config.dart` to load these:

```dart
googleClientIdAndroid = const String.fromEnvironment(
  'GOOGLE_CLIENT_ID_ANDROID',
  defaultValue: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
);

googleClientIdIos = const String.fromEnvironment(
  'GOOGLE_CLIENT_ID_IOS',
  defaultValue: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
);
```

---

## Step 7: Configure Android Signing

Create a release keystore for production:

```bash
cd mobile/android/app
keytool -genkey -v -keystore release.keystore -alias blackpill -keyalg RSA -keysize 2048 -validity 10000
```

Then configure signing in `mobile/android/app/build.gradle`:

```gradle
signingConfigs {
    release {
        storeFile file('release.keystore')
        storePassword 'your-store-password'
        keyAlias 'blackpill'
        keyPassword 'your-key-password'
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

Get the release SHA-1:
```bash
keytool -list -v -keystore release.keystore -alias blackpill
```

Then create another Android OAuth Client ID in Google Cloud Console with the release SHA-1.

---

## Step 8: Test Google Sign-In

### Android
- Run the app on Android emulator or device
- Click "Sign in with Google"
- Select account and verify it works

### iOS
- Run the app on iOS simulator or device
- Click "Sign in with Google"
- Verify it opens Google login and returns to app

---

## Troubleshooting

**Android SHA-1 doesn't match:**
- Make sure you're using the correct keystore file
- Check that keystore password is correct (`android` for debug)
- If using release build, use the release keystore SHA-1

**iOS won't show Google sign-in:**
- Verify Bundle ID matches exactly in Google Cloud Console
- Check Team ID is correct
- Ensure iOS app has correct provisioning profile

**"Invalid client" error:**
- Verify Client ID is correct and not truncated
- Check that OAuth consent screen is configured
- Wait 5-10 minutes after creating credentials (caching)

---

## References

- [Google Sign-In for Android](https://developers.google.com/identity/sign-in/android)
- [Google Sign-In for iOS](https://developers.google.com/identity/sign-in/ios)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Apple Developer Portal](https://developer.apple.com/account/)
