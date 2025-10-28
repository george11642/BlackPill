# Black Pill - Quick Start Guide 🚀

The fastest way to get Black Pill running locally.

---

## ⚡ TL;DR

```bash
# 1. Clone repo
git clone https://github.com/yourorg/black-pill.git
cd black-pill

# 2. Setup Supabase (get URL + keys from supabase.com)
cd supabase
supabase link --project-ref YOUR_REF
supabase db push
cd ..

# 3. Backend - Add API keys to backend/.env then:
cd backend
npm install
vercel dev
# Running on http://localhost:3000

# 4. Mobile - Add keys to mobile/.env then:
cd mobile
flutter pub get
flutter run
# Choose device and launch!
```

---

## 📋 Prerequisites

Install these first:
- ✅ Flutter SDK 3.2.0+ ([flutter.dev](https://flutter.dev))
- ✅ Node.js 18+ ([nodejs.org](https://nodejs.org))
- ✅ Vercel CLI: `npm install -g vercel`
- ✅ Supabase CLI: `npm install -g supabase`

---

## 🔑 Get Your API Keys (15 minutes)

### 1. Supabase (Required)
1. Go to [supabase.com](https://supabase.com)
2. Create project
3. Copy from Settings → API:
   - Project URL
   - Anon key
   - Service role key

### 2. OpenAI (Required)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key
3. Add billing details
4. Copy key (starts with `sk-`)

### 3. Google Cloud (Required)
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project
3. Enable "Cloud Vision API"
4. Create service account
5. Download JSON key file

### 4. Stripe (Optional for testing)
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Use test mode
3. Copy test secret key
4. Skip products for now

---

## 🛠️ Setup (10 minutes)

### 1. Database
```bash
cd supabase
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

✅ Creates all 11 tables, indexes, and policies

### 2. Backend Environment
```bash
cd backend
cp env.example .env
```

Edit `.env`:
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5-mini
GOOGLE_CLOUD_PROJECT_ID=your-project
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

Place Google `service-account.json` in backend folder.

### 3. Mobile Environment
```bash
cd mobile
cp env.example .env
```

Edit `.env`:
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
API_BASE_URL=http://localhost:3000
```

---

## 🚀 Run (2 commands)

### Terminal 1 - Backend
```bash
cd backend
npm install
vercel dev
```
✅ API running on http://localhost:3000

### Terminal 2 - Mobile
```bash
cd mobile
flutter pub get
flutter run
```
✅ App launches on your device/emulator

---

## ✅ Verify It Works

1. **Sign up** with test email
2. **Take photo** or upload from gallery
3. **Wait 10-30 seconds** for AI analysis
4. **View results** with animated score
5. **Try sharing** your results
6. **Check referral stats**

If all works → **You're ready to develop! 🎉**

---

## 🐛 Common Issues

### "Can't connect to backend"
- Backend running? Check `vercel dev` output
- **iOS simulator:** Use `http://localhost:3000`
- **Android emulator:** Use `http://10.0.2.2:3000`
- Update `API_BASE_URL` in mobile/.env

### "Google Vision API failed"
- Check service account JSON is in backend folder
- Verify Vision API is enabled in Google Cloud
- Check file path in GOOGLE_APPLICATION_CREDENTIALS

### "OpenAI API failed"
- Verify API key is correct
- Check you have credits/billing set up
- Model is `gpt-5-mini` (verify it exists)

### "Supabase error"
- Double-check URL and keys
- Verify migrations ran: `supabase db push`
- Check tables exist in Supabase dashboard

---

## 📱 Device Setup

### iOS
```bash
# Open iOS simulator
open -a Simulator

# Run app
flutter run -d "iPhone 15"
```

### Android
```bash
# List devices
flutter devices

# Run on emulator
flutter run -d emulator-5554
```

### Physical Device
```bash
# Enable developer mode on device
# Connect via USB
flutter devices
flutter run -d YOUR_DEVICE_ID
```

---

## 🎨 Explore the App

### Phase 1 Features
- 📸 **Scan Tab** - Take photo, get AI analysis
- 💳 **Paywall** - View subscription tiers
- 🎁 **Referral Stats** - From profile menu
- 👤 **Profile** - Tap avatar in top right

### Phase 2 Features (Now Available!)
- 🏆 **Leaderboard Tab** - See weekly rankings
- 📈 **Progress Tab** - Track your journey
- 👥 **Community Tab** - Social features
- ⭐ **Achievements** - In progress screen

---

## 🎯 Next Steps

1. **Explore the code**
   - Start with `mobile/lib/main.dart`
   - Check `mobile/lib/features/` for features
   - Review `backend/api/` for endpoints

2. **Make changes**
   - Hot reload works automatically
   - Both Flutter and Vercel support it

3. **Add your branding**
   - Replace icons in `mobile/assets/`
   - Update colors if needed (not recommended)
   - Add your logo

4. **Deploy**
   - Follow `docs/DEPLOYMENT_CHECKLIST.md`
   - Takes ~2 hours + app review time

---

## 💡 Pro Tips

1. **Use test data** - Don't use real photos during development
2. **Monitor costs** - OpenAI charges per API call
3. **Hot reload** - Make changes without restarting
4. **Supabase dashboard** - Great for inspecting data
5. **PostHog** - Set up to see real analytics

---

## 📞 Get Help

- **Documentation:** See `/docs` folder
- **API Reference:** `docs/API_DOCUMENTATION.md`
- **Design System:** `docs/DESIGN_SYSTEM.md`
- **Issues:** Create GitHub issue

---

**Ready to build something amazing! 🚀**

Estimated time to first run: **15-20 minutes**

