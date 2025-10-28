# Black Pill Mobile App

AI-powered attractiveness analysis app built with Flutter.

## Prerequisites

- Flutter SDK 3.2.0 or higher
- Dart SDK
- Android Studio / Xcode for mobile development
- Firebase CLI (for push notifications)

## Setup

1. **Install Dependencies**
   ```bash
   flutter pub get
   ```

2. **Environment Configuration**
   - Copy `env.example` to `.env`
   - Fill in your API keys and configuration values

3. **Firebase Setup** (for push notifications)
   - Download `google-services.json` (Android) and place in `android/app/`
   - Download `GoogleService-Info.plist` (iOS) and place in `ios/Runner/`

4. **Generate Code**
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

## Running the App

### Development
```bash
flutter run
```

### Production Build
```bash
# Android
flutter build apk --release

# iOS
flutter build ipa --release
```

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── app.dart                  # App widget with routing
├── config/                   # Configuration (env, theme, constants)
├── core/                     # Core utilities, extensions, services
├── features/                 # Feature modules
│   ├── auth/                # Authentication
│   ├── analysis/            # Photo analysis
│   ├── results/             # Results & sharing
│   ├── referral/            # Referral system
│   ├── subscription/        # Subscriptions & paywall
│   ├── onboarding/          # Onboarding flow
│   ├── leaderboard/         # Leaderboard (Phase 2)
│   └── profile/             # User profile
└── shared/                   # Shared widgets & components
```

## Features

### Phase 1 (MVP)
- ✅ Email/password & Google OAuth authentication
- ✅ Photo capture & upload
- ✅ AI-powered facial analysis
- ✅ Score visualization & breakdown
- ✅ Share card generation
- ✅ Referral system with deep linking
- ✅ Subscription tiers & paywall
- ✅ Stripe checkout integration

### Phase 2
- Leaderboard
- Progress tracking
- Community features
- Creator/Affiliate program

## Testing

```bash
# Unit tests
flutter test

# Integration tests
flutter test integration_test

# Code coverage
flutter test --coverage
```

## Code Generation

This project uses code generation for:
- Riverpod providers
- Retrofit API clients
- JSON serialization

Run the build runner whenever you add new generated files:
```bash
flutter pub run build_runner watch
```

## Design System

See `/docs/design-system.md` for:
- Color palette
- Typography
- Component specifications
- Animation guidelines

## License

Proprietary - All rights reserved

