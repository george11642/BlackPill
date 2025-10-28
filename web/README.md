# Black Pill Creator Dashboard

Web dashboard for creators and affiliates in the Black Pill program.

## Tech Stack

- **Framework**: Next.js 14
- **UI**: React + Tailwind CSS
- **Charts**: Recharts
- **API**: Axios (connects to Black Pill backend)

## Features

- 📊 Performance analytics (clicks, conversions, revenue)
- 💰 Earnings tracking & payout history
- 🎟️ Coupon code generation
- 📈 Daily performance charts
- 🔗 Affiliate link management
- 📥 Marketing assets download

## Setup

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```

Or connect GitHub repo for automatic deployments.

## Authentication

Creators must be approved in the main app first. They can then access the dashboard at:

```
https://creators.blackpill.app
```

Login uses the same credentials as the mobile app.

## License

Proprietary - All rights reserved

