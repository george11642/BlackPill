# Black Pill Backend

Express.js API backend for Black Pill mobile app, deployed on Vercel.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-5 Mini, Google Cloud Vision
- **Payments**: Stripe
- **Hosting**: Vercel (Serverless)
- **Rate Limiting**: Upstash Redis

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - Copy `env.example` to `.env`
   - Fill in your API keys and configuration

3. **Google Cloud Setup**
   - Download service account JSON from Google Cloud Console
   - Place it in the backend directory
   - Set `GOOGLE_APPLICATION_CREDENTIALS` path in `.env`

4. **Stripe Setup**
   - Get your Stripe secret key and webhook secret
   - Configure webhook endpoint: `https://your-api.vercel.app/api/webhooks/stripe`
   - Add webhook events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`

## Development

```bash
# Run locally with Vercel CLI
npm run dev

# Access at http://localhost:3000
```

## Deployment

```bash
# Deploy to Vercel
npm run deploy

# Or connect GitHub repo to Vercel for automatic deployments
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Sign out

### Analysis
- `POST /api/analyze` - Analyze photo
- `GET /api/analyses` - Get user's analyses
- `GET /api/analyses/:id` - Get specific analysis
- `DELETE /api/analyses/:id` - Delete analysis

### Referrals
- `POST /api/referral/accept` - Accept referral code
- `GET /api/referral/stats` - Get referral statistics
- `GET /api/leaderboard/referrals` - Get referral leaderboard

### Subscriptions
- `POST /api/subscriptions/create-checkout` - Create Stripe checkout session
- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions/cancel` - Cancel subscription
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Sharing
- `GET /api/share/generate-card` - Generate share card image

### Creators (Phase 2)
- `POST /api/creators/apply` - Apply for creator program
- `GET /api/creators/dashboard` - Creator dashboard data
- `GET /api/creators/performance` - Performance analytics
- `POST /api/creators/coupons` - Create coupon code

## Testing

```bash
npm test
```

## Rate Limits

- `/api/analyze`: 5 requests per 10 minutes (free), 20 requests (premium)
- `/api/auth/signup`: 3 requests per hour per IP
- `/api/leaderboard`: 60 requests per minute
- `/api/share/generate-card`: 10 requests per hour

## Error Codes

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions/scans)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## License

Proprietary - All rights reserved

