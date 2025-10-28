# Getting Started Guide

Complete guide to getting Black Pill running locally for development.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Flutter SDK 3.2.0 or higher**
   - Download from: https://flutter.dev/docs/get-started/install
   - Verify: `flutter --version`

2. **Node.js 18 or higher**
   - Download from: https://nodejs.org
   - Verify: `node --version` and `npm --version`

3. **Git**
   - Download from: https://git-scm.com
   - Verify: `git --version`

4. **Vercel CLI**
   ```bash
   npm install -g vercel
   ```

5. **Supabase CLI**
   ```bash
   npm install -g supabase
   ```

### Development Tools

- **Visual Studio Code** (recommended) or Android Studio
- **Xcode** (for iOS development, macOS only)
- **Android Studio** (for Android development)

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourorg/black-pill.git
cd black-pill
```

## Step 2: Backend Setup

### 2.1 Install Dependencies

```bash
cd backend
npm install
```

### 2.2 Configure Environment

```bash
cp env.example .env
```

Edit `.env` and fill in the following:

#### Supabase (Required)
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → API
4. Copy URL and keys

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

#### OpenAI (Required)
1. Go to https://platform.openai.com
2. Create API key
3. Add to .env:

```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-5-mini
```

#### Google Cloud Vision (Required)
1. Go to https://console.cloud.google.com
2. Create project and enable Vision API
3. Create service account and download JSON key
4. Place JSON file in backend folder
5. Add to .env:

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

#### Stripe (Optional for testing payments)
1. Go to https://dashboard.stripe.com
2. Get test API keys

```env
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret
```

#### Redis (Optional for rate limiting)
1. Go to https://upstash.com
2. Create Redis database
3. Copy connection URL

```env
REDIS_URL=redis://default:password@host:port
```

### 2.3 Run Database Migrations

```bash
cd ../supabase
supabase link --project-ref your-project-ref
supabase db push
```

Or manually run migrations in Supabase SQL Editor:
- Copy contents of `supabase/migrations/001_initial_schema.sql`
- Paste and run in SQL Editor
- Repeat for other migration files

### 2.4 Start Backend Server

```bash
cd ../backend
vercel dev
```

Backend should now be running at http://localhost:3000

## Step 3: Mobile App Setup

### 3.1 Install Dependencies

```bash
cd ../mobile
flutter pub get
```

### 3.2 Configure Environment

```bash
cp env.example .env
```

Edit `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
API_BASE_URL=http://localhost:3000
STRIPE_PUBLISHABLE_KEY=pk_test_your-key
```

### 3.3 Setup Firebase (for Push Notifications)

#### iOS
1. Go to Firebase Console
2. Create project and add iOS app
3. Download `GoogleService-Info.plist`
4. Place in `mobile/ios/Runner/`

#### Android
1. In same Firebase project, add Android app
2. Download `google-services.json`
3. Place in `mobile/android/app/`

### 3.4 Generate Code

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### 3.5 Run the App

```bash
# List available devices
flutter devices

# Run on specific device
flutter run -d <device-id>

# Or just run (will prompt for device selection)
flutter run
```

## Step 4: Verify Everything Works

### Test Backend

1. Check health endpoint:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. Check database connection:
   - Go to Supabase dashboard
   - Check that tables were created

### Test Mobile App

1. Launch app on emulator/simulator
2. Try signing up with test email
3. Upload a test photo (use a clear face photo)
4. Verify analysis works

## Common Issues & Solutions

### Backend Issues

**Issue: Google Cloud Vision fails**
- Solution: Make sure service account JSON is in the right location and has Vision API access

**Issue: OpenAI API fails**
- Solution: Check API key is valid and has credits

**Issue: Database connection fails**
- Solution: Verify Supabase URL and keys are correct

### Mobile App Issues

**Issue: Build fails**
- Solution: Run `flutter clean` then `flutter pub get`

**Issue: Can't connect to backend**
- Solution: Make sure backend is running and `API_BASE_URL` is correct
- On iOS simulator, use `http://localhost:3000`
- On Android emulator, use `http://10.0.2.2:3000`

**Issue: Firebase not configured**
- Solution: Make sure you've added the config files to the correct locations

## Development Workflow

### Making Changes

1. **Backend changes**:
   ```bash
   cd backend
   # Vercel dev has hot reload
   vercel dev
   ```

2. **Mobile changes**:
   ```bash
   cd mobile
   # Hot reload works automatically
   flutter run
   ```

3. **Database changes**:
   ```bash
   cd supabase
   # Create new migration
   supabase migration new your_migration_name
   # Edit the SQL file
   # Apply migration
   supabase db push
   ```

### Code Generation

When you change Riverpod providers or add JSON models:

```bash
cd mobile
flutter pub run build_runner watch
```

This will watch for changes and regenerate code automatically.

## Next Steps

1. Read the [PRD](../PRD.md) to understand all features
2. Explore the codebase structure
3. Try implementing a simple feature
4. Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment

## Getting Help

- Check existing issues on GitHub
- Review the PRD for specifications
- Contact dev team: dev@blackpill.app

## Development Tips

1. **Use test data**: Create test users and don't use real personal photos during development

2. **API rate limits**: Be aware of OpenAI and Google Cloud API costs during development

3. **Hot reload**: Both Flutter and Vercel support hot reload for fast development

4. **Database**: Use Supabase dashboard for quick data inspection

5. **Debugging**:
   - Backend: Check Vercel dev console logs
   - Mobile: Use Flutter DevTools
   - Database: Use Supabase logs

Happy coding! 🚀

