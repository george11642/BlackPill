# Black Pill

AI-powered attractiveness analysis application with actionable self-improvement tips.

## Project Structure

```
BlackPill/
├── mobile/                 # React Native/Expo mobile app
├── web/                    # Next.js web app + API routes
├── supabase/               # Database migrations
├── docs/                   # Documentation
│   ├── PRD.md             # Product Requirements Document
│   └── MIGRATION_GUIDE.md # Migration guide
└── vercel.json            # Single Vercel deployment config
```

## Architecture

- **Mobile**: React Native/Expo (iOS, Android, Web)
- **Web**: Next.js 16 with App Router
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: Supabase PostgreSQL
- **Deployment**: Single Vercel project

## Migration Status

This project is currently being migrated from Flutter + Express.js to React Native/Expo + Next.js API routes.

See `docs/MIGRATION_GUIDE.md` for detailed migration instructions and status.

## Quick Start

### Mobile Development

```bash
cd mobile
npm install
npm start
```

### Web Development

```bash
cd web
npm install
npm run dev
```

### Build for Production

The build process is automated via Vercel:
1. Builds Expo web app from `mobile/`
2. Builds Next.js app from `web/`
3. Deploys everything to a single Vercel project

## Environment Variables

See `mobile/env.example` and `web/.env.example` for required environment variables.

## Documentation

- [Migration Guide](docs/MIGRATION_GUIDE.md) - Detailed migration instructions
- [PRD](docs/PRD.md) - Product Requirements Document
