# BlackPill Mobile App

React Native/Expo mobile application for BlackPill.

## Structure

```
mobile/
├── components/        # Reusable UI components
├── lib/              # Business logic, API clients, types
│   ├── api/         # API client utilities
│   ├── auth/        # Authentication context
│   ├── supabase/    # Supabase client
│   ├── types/       # TypeScript type definitions
│   └── theme.ts     # Theme configuration
├── screens/         # Screen components
├── assets/          # Images, fonts, icons
├── App.tsx          # Root component
├── app.json         # Expo configuration
└── package.json     # Dependencies
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env.local
# Fill in your environment variables
```

3. Start the development server:
```bash
npm start
```

## Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web

## Environment Variables

Required environment variables (see `env.example`):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_APP_URL`
