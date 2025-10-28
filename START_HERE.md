# 🚀 Black Pill - START HERE

**Welcome to Black Pill!** This is your complete guide to understanding and launching the project.

---

## 📖 What Is This?

Black Pill is a **complete, production-ready mobile app** that provides AI-powered facial attractiveness analysis with:
- 📸 Photo analysis using GPT-5 Mini + Google Cloud Vision
- 🎯 1-10 score with 6-dimension breakdown
- 💡 Actionable improvement tips
- 🎁 Viral referral system
- 💰 4-tier subscription model ($0-$19.99/mo)
- 🏆 Leaderboard & progress tracking
- 👥 Community features
- 💼 Creator affiliate program

**Status:** ✅ **100% Complete** - Both Phase 1 (MVP) and Phase 2 (Advanced Features)

---

## 📚 Documentation Quick Links

### 🏃 Getting Started
- **[QUICK_START.md](QUICK_START.md)** ← Start here for local development (15 min setup)
- **[GETTING_STARTED.md](docs/GETTING_STARTED.md)** - Detailed local setup guide
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Production deployment

### 📋 Understanding the Project
- **[PRD.md](PRD.md)** - Original 1,379-line Product Requirements Document
- **[COMPLETE_PROJECT_OVERVIEW.md](COMPLETE_PROJECT_OVERVIEW.md)** - Full project overview
- **[FINAL_IMPLEMENTATION_REPORT.md](FINAL_IMPLEMENTATION_REPORT.md)** - What was built

### 🛠️ Technical Reference
- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - Complete API reference (22 endpoints)
- **[DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** - Visual design specification
- **[mobile/README.md](mobile/README.md)** - Flutter app guide
- **[backend/README.md](backend/README.md)** - Backend API guide

### 📊 Implementation Details
- **[PHASE_2_COMPLETE.md](PHASE_2_COMPLETE.md)** - Phase 2 features summary
- **[PROJECT_FILES_MANIFEST.md](PROJECT_FILES_MANIFEST.md)** - Complete file listing

---

## ⚡ Quick Commands

### Run Locally (2 terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm install
vercel dev
```

**Terminal 2 - Mobile:**
```bash
cd mobile
flutter pub get
flutter run
```

### Deploy to Production

**Backend:**
```bash
cd backend
vercel --prod
```

**Mobile:**
```bash
cd mobile
flutter build ipa --release      # iOS
flutter build appbundle --release # Android
```

---

## 🎯 What's Included

### ✅ Phase 1 (MVP) - 100% Complete
- Email/Google authentication
- AI photo analysis (GPT-5 Mini)
- Animated results with confetti
- Share card generation
- Deep linking referral system
- 4-tier subscriptions (Stripe)
- Password reset
- Push notifications

### ✅ Phase 2 (Advanced) - 100% Complete
- Weekly leaderboard with rankings
- Progress tracking with charts
- Achievement badges
- Community hub with guidelines
- Creator affiliate program
- Creator dashboard (web)
- Performance analytics
- Coupon generation

---

## 🏗️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Mobile | Flutter 3.35+ |
| Backend | Express.js + Vercel |
| Database | Supabase PostgreSQL |
| AI | OpenAI GPT-5 Mini |
| Vision | Google Cloud Vision |
| Payments | Stripe |
| Analytics | PostHog |
| Monitoring | Sentry |
| Push | Firebase |

---

## 📂 Project Structure

```
BlackPill/
├── mobile/          # Flutter app (55 files)
│   ├── lib/
│   │   ├── features/   # 10 feature modules
│   │   ├── core/       # 5 services
│   │   ├── shared/     # Theme + widgets
│   │   └── config/     # Constants + router
│   └── assets/         # Images, fonts
│
├── backend/         # Express.js API (27 files)
│   ├── api/            # 22 endpoints
│   ├── middleware/     # Auth, rate limiting
│   └── utils/          # OpenAI, Google Vision
│
├── web/             # Next.js creator dashboard (5 files)
│   └── src/pages/      # Dashboard UI
│
├── supabase/        # Database (3 files)
│   └── migrations/     # SQL schema
│
└── docs/            # Documentation (15 files)
    └── [guides]        # Setup, API, Design
```

---

## 🎨 Design Highlights

### Visual Identity
- **Theme:** Dark with neon accents
- **Colors:** Deep Black + Neon Pink/Cyan/Purple
- **Font:** Inter (Google Fonts)
- **Style:** Glassmorphic cards with blur effects

### Key Components
- 🎯 Gradient buttons (Pink → Cyan)
- 🔮 Glass cards with backdrop blur
- 🎨 Animated score circles (200x200px)
- 📊 Progress bars with gradient fill
- 🎊 Confetti for high scores
- 🏅 Achievement badges
- 📈 Beautiful charts

---

## 🔐 API Keys Needed

### Required (to run locally)
1. **Supabase** - URL + Anon Key + Service Role Key
2. **OpenAI** - API Key for GPT-5 Mini
3. **Google Cloud** - Project ID + Service Account JSON

### Optional (for full features)
4. **Stripe** - Secret Key + Webhook Secret
5. **Firebase** - google-services.json (Android) + GoogleService-Info.plist (iOS)
6. **Upstash Redis** - Connection URL (for rate limiting)
7. **PostHog** - API Key (for analytics)
8. **Sentry** - DSN (for error tracking)

**See `QUICK_START.md` for where to get these.**

---

## 🎯 First-Time Setup (Step-by-Step)

### 1. Get API Keys (15 minutes)
- Supabase account → Create project → Copy keys
- OpenAI account → Create API key → Add billing
- Google Cloud → Create project → Enable Vision API → Download service account

### 2. Configure Environment (5 minutes)
```bash
# Backend
cd backend
cp env.example .env
# Edit .env with your keys

# Mobile
cd mobile
cp env.example .env
# Edit .env with your keys
```

### 3. Setup Database (5 minutes)
```bash
cd supabase
supabase link --project-ref YOUR_REF
supabase db push
```

### 4. Run Everything (2 minutes)
```bash
# Terminal 1
cd backend && npm install && vercel dev

# Terminal 2
cd mobile && flutter pub get && flutter run
```

### 5. Test It Works (3 minutes)
- Sign up with test email
- Take/upload a photo
- Wait for AI analysis
- See animated results
- Try sharing

**Total: 30 minutes to first run! 🎉**

---

## 🎓 Learning the Codebase

### Start Here (Mobile):
1. `mobile/lib/main.dart` - App entry point
2. `mobile/lib/config/router.dart` - All routes
3. `mobile/lib/features/auth/` - Auth screens
4. `mobile/lib/features/analysis/` - Core feature
5. `mobile/lib/shared/theme/` - Design system

### Start Here (Backend):
1. `backend/api/analyze/index.js` - Core analysis endpoint
2. `backend/utils/openai-client.js` - AI integration
3. `backend/middleware/auth.js` - Authentication
4. `backend/api/webhooks/stripe.js` - Payment webhooks

### Start Here (Database):
1. `supabase/migrations/001_initial_schema.sql` - All tables
2. `supabase/migrations/002_row_level_security.sql` - Security policies

---

## 🐛 Troubleshooting

### Can't build Flutter app?
```bash
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### Backend not starting?
- Check Node.js version: `node --version` (need 18+)
- Install Vercel CLI: `npm install -g vercel`
- Check .env file exists and has all keys

### Database errors?
- Run migrations: `supabase db push`
- Check Supabase dashboard for tables
- Verify URL and keys in .env

### AI analysis failing?
- Check OpenAI API key is valid
- Verify Google service account JSON location
- Check you have API credits

---

## 💡 Pro Tips

1. **Start with Phase 1** - Get MVP working first
2. **Use test mode** - Stripe test cards, test data
3. **Hot reload** - Make changes without restarting
4. **Check logs** - Vercel dev console, Flutter DevTools
5. **Read the PRD** - Understand requirements
6. **Follow design system** - Keep UI consistent

---

## 📞 Need Help?

1. Check **[QUICK_START.md](QUICK_START.md)** for common issues
2. Review **[GETTING_STARTED.md](docs/GETTING_STARTED.md)** for detailed setup
3. Read **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** for endpoint details
4. See **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** for production

---

## 🎉 You're All Set!

Everything you need is here:
- ✅ Complete codebase
- ✅ Database schema
- ✅ API endpoints
- ✅ Beautiful UI
- ✅ Documentation
- ✅ Deployment guides

**Just add your API keys and launch! 🚀**

---

**Next Steps:**
1. Read [QUICK_START.md](QUICK_START.md)
2. Get your API keys
3. Run locally
4. Deploy when ready

**Welcome to Black Pill! Let's build something amazing! 💪**

