# Black Pill API Documentation

Complete API reference for Black Pill backend.

**Base URL:** `https://api.black-pill.app`

**Authentication:** All endpoints (except webhooks) require Bearer token in Authorization header.

---

## Authentication Endpoints

### POST /api/auth/signup
Sign up with email and password (handled by Supabase).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "age_verified": true
}
```

**Response:** `200 OK`
```json
{
  "user_id": "uuid",
  "token": "jwt_token",
  "referral_code": "INVITE-1234-5678"
}
```

**Errors:**
- `400` - Invalid email/password
- `409` - Email already exists

---

### POST /api/auth/login
Sign in with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:** `200 OK`
```json
{
  "user_id": "uuid",
  "token": "jwt_token",
  "tier": "free",
  "scans_remaining": 1
}
```

**Errors:**
- `401` - Invalid credentials
- `403` - Account suspended

---

### GET /api/auth/me
Get current user profile.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "tier": "free",
  "scans_remaining": 1,
  "referral_code": "INVITE-1234-5678",
  "username": "john_doe",
  "avatar_url": "https://...",
  "bio": "Self-improvement enthusiast",
  "location": "New York, USA"
}
```

---

## Analysis Endpoints

### POST /api/analyze
Analyze a facial photo.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request:**
```
Form data:
  image: File (max 2MB, JPEG/PNG)
```

**Response:** `200 OK`
```json
{
  "analysis_id": "uuid",
  "score": 7.8,
  "breakdown": {
    "symmetry": 8.0,
    "jawline": 7.5,
    "eyes": 8.2,
    "lips": 7.6,
    "skin": 7.0,
    "bone_structure": 7.8
  },
  "tips": [
    {
      "title": "Improve Skin Health",
      "description": "Start a daily skincare routine...",
      "timeframe": "2-4 weeks for visible results"
    }
  ],
  "scans_remaining": 0
}
```

**Errors:**
- `400` - Invalid image, no face detected, multiple faces, poor quality
- `403` - No scans remaining, tier restriction
- `429` - Rate limited (5 requests per 10 min free, 20 premium)
- `500` - AI service error

---

### GET /api/analyses
Get user's analysis history.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (default: 10) - Number of results
- `offset` (default: 0) - Pagination offset
- `order_by` (default: 'created_at') - Sort field

**Response:** `200 OK`
```json
{
  "analyses": [
    {
      "id": "uuid",
      "score": 7.8,
      "breakdown": {...},
      "tips": [...],
      "created_at": "2025-10-27T12:00:00Z"
    }
  ],
  "total": 15
}
```

---

### GET /api/analyses/:id
Get specific analysis.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "score": 7.8,
  "breakdown": {...},
  "tips": [...],
  "image_url": "https://...",
  "image_thumbnail_url": "https://...",
  "is_public": false,
  "created_at": "2025-10-27T12:00:00Z"
}
```

**Errors:**
- `404` - Analysis not found
- `403` - Not authorized (private analysis)

---

### DELETE /api/analyses/:id
Delete an analysis (soft delete).

**Response:** `200 OK`
```json
{
  "success": true
}
```

---

## Referral Endpoints

### POST /api/referral/accept
Accept a referral code.

**Request:**
```json
{
  "referral_code": "INVITE-1234-5678"
}
```

**Response:** `200 OK`
```json
{
  "bonus_scans": 5,
  "referrer_name": "JohnDoe",
  "message": "You got 5 free scans from JohnDoe!"
}
```

**Errors:**
- `400` - Invalid code
- `409` - Already used a referral code
- `403` - Fraud detected

---

### GET /api/referral/stats
Get referral statistics.

**Response:** `200 OK`
```json
{
  "referral_code": "INVITE-1234-5678",
  "total_invited": 15,
  "accepted": 10,
  "pending": 5,
  "total_bonus_scans": 50,
  "invite_streak": 7
}
```

---

### GET /api/leaderboard/referrals
Get referral leaderboard.

**Query Parameters:**
- `limit` (default: 10)
- `offset` (default: 0)

**Response:** `200 OK`
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "username": "TopReferrer",
      "total_invited": 150,
      "accepted": 120
    }
  ]
}
```

---

## Subscription Endpoints

### POST /api/subscriptions/create-checkout
Create Stripe checkout session.

**Request:**
```json
{
  "tier": "basic",
  "interval": "monthly",
  "coupon_code": "WELCOME50"
}
```

**Response:** `200 OK`
```json
{
  "session_id": "cs_test_...",
  "checkout_url": "https://checkout.stripe.com/..."
}
```

**Errors:**
- `400` - Invalid tier/interval
- `409` - Already subscribed

---

### GET /api/subscriptions/status
Get subscription status.

**Response:** `200 OK`
```json
{
  "tier": "basic",
  "status": "active",
  "current_period_start": "2025-10-01T00:00:00Z",
  "current_period_end": "2025-11-01T00:00:00Z",
  "cancel_at_period_end": false,
  "manage_url": "https://billing.stripe.com/..."
}
```

---

### POST /api/subscriptions/cancel
Cancel subscription (at end of period).

**Response:** `200 OK`
```json
{
  "success": true,
  "effective_date": "2025-11-01T00:00:00Z"
}
```

---

## Sharing Endpoints

### GET /api/share/generate-card
Generate share card for analysis.

**Query Parameters:**
- `analysis_id` - UUID of analysis

**Response:** `200 OK`
```json
{
  "analysis_id": "uuid",
  "score": 7.8,
  "breakdown": {...},
  "referral_code": "INVITE-1234-5678",
  "share_url": "https://blackpill.app/ref/INVITE-1234-5678",
  "image_url": "https://..."
}
```

---

## Leaderboard Endpoints

### GET /api/leaderboard
Get score-based leaderboard.

**Query Parameters:**
- `limit` (default: 10)
- `offset` (default: 0)
- `filter` - 'this_week', 'all_time', 'by_location'

**Response:** `200 OK`
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "uuid",
      "username": "TopScorer",
      "avatar_url": "https://...",
      "location": "New York",
      "score": 9.2
    }
  ]
}
```

---

## Creator Endpoints

### POST /api/creators/apply
Apply for creator program.

**Request:**
```json
{
  "name": "John Doe",
  "instagram_handle": "@johndoe",
  "tiktok_handle": "@johndoe",
  "instagram_follower_count": 50000,
  "tiktok_follower_count": 30000,
  "bio": "Fitness and style content creator"
}
```

**Response:** `200 OK`
```json
{
  "application_id": "uuid",
  "status": "pending",
  "message": "Application submitted! We'll review within 48 hours."
}
```

---

### GET /api/creators/dashboard
Get creator dashboard data (approved creators only).

**Response:** `200 OK`
```json
{
  "creator_id": "uuid",
  "affiliate_link": "https://bp.app/ref/johndoe",
  "tier": "micro",
  "commission_rate": 0.25,
  "stats": {
    "total_clicks": 1523,
    "total_conversions": 187,
    "conversion_rate": "12.28",
    "revenue_this_month": "465.75",
    "payout_pending": "1250.00",
    "next_payout_date": "2025-11-15"
  }
}
```

**Errors:**
- `404` - Not a creator
- `403` - Not approved yet

---

### GET /api/creators/performance
Get performance analytics with daily breakdown.

**Query Parameters:**
- `start_date` - ISO date (default: 30 days ago)
- `end_date` - ISO date (default: today)

**Response:** `200 OK`
```json
{
  "daily_data": [
    {
      "date": "2025-10-27",
      "clicks": 45,
      "conversions": 6,
      "revenue": 29.94
    }
  ]
}
```

---

### POST /api/creators/coupons
Create discount coupon.

**Request:**
```json
{
  "code": "CREATOR50",
  "discount_percent": 50,
  "max_uses": 100,
  "expires_at": "2025-12-31T23:59:59Z"
}
```

**Response:** `200 OK`
```json
{
  "coupon_id": "uuid",
  "code": "CREATOR50",
  "discount_percent": 50,
  "max_uses": 100,
  "tracking_url": "https://blackpill.app/subscribe?coupon=CREATOR50"
}
```

**Errors:**
- `400` - Invalid discount percent (must be 0-100)
- `409` - Coupon code already exists

---

## Webhook Endpoints

### POST /api/webhooks/stripe
Stripe webhook handler.

**Headers:**
```
Stripe-Signature: {signature}
```

**Events Handled:**
- `checkout.session.completed` - Creates/updates subscription
- `customer.subscription.created` - Updates subscription record
- `customer.subscription.updated` - Updates status
- `customer.subscription.deleted` - Downgrades to free
- `invoice.paid` - Resets monthly scans
- `invoice.payment_failed` - Logs failure

**Response:** `200 OK`
```json
{
  "received": true
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/analyze | 5 (free), 20 (premium) | 10 minutes |
| POST /api/auth/* | 3 | 1 hour per IP |
| GET /api/leaderboard | 60 | 1 minute |
| GET /api/share/generate-card | 10 | 1 hour |
| Creator endpoints | 100 | 1 minute |

**Rate Limit Response:** `429 Too Many Requests`
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 60 seconds.",
  "retryAfter": 60
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message"
}
```

### Common Status Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Rate Limited
- `500` - Internal Server Error

---

## Data Models

### User
```typescript
{
  id: UUID
  email: string
  tier: 'free' | 'basic' | 'pro' | 'unlimited'
  scans_remaining: number
  total_scans_used: number
  referral_code: string
  username?: string
  avatar_url?: string
  bio?: string
  location?: string
  age_verified: boolean
  created_at: timestamp
}
```

### Analysis
```typescript
{
  id: UUID
  user_id: UUID
  score: number (1.0-10.0)
  breakdown: {
    symmetry: number
    jawline: number
    eyes: number
    lips: number
    skin: number
    bone_structure: number
  }
  tips: Array<{
    title: string
    description: string
    timeframe: string
  }>
  image_url: string
  image_thumbnail_url: string
  is_public: boolean
  created_at: timestamp
}
```

### Subscription
```typescript
{
  id: UUID
  user_id: UUID
  tier: 'basic' | 'pro' | 'unlimited'
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  stripe_customer_id: string
  stripe_subscription_id: string
  current_period_start: timestamp
  current_period_end: timestamp
  canceled_at?: timestamp
}
```

### Creator
```typescript
{
  id: UUID
  user_id: UUID
  name: string
  instagram_handle?: string
  tiktok_handle?: string
  affiliate_link: string
  tier: 'nano' | 'micro' | 'macro'
  commission_rate: number (0.20-0.30)
  total_earned: number
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  created_at: timestamp
}
```

---

## Testing

### Test Credentials
```
Email: test@blackpill.app
Password: testpass123
```

### Stripe Test Cards
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **Requires 3DS:** 4000 0025 0000 3155

### Testing Workflow
1. Sign up with test email
2. Upload test image (use a clear face photo)
3. Verify analysis completes
4. Test sharing
5. Enter referral code (create 2nd account)
6. Test subscription with test card
7. Verify webhook handling

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `limit` - Items per page (default: 10, max: 100)
- `offset` - Number of items to skip (default: 0)

**Example:**
```
GET /api/analyses?limit=20&offset=40
```
Returns items 41-60.

---

## Versioning

Current API version: **v1**

All endpoints are currently at `/api/*`. Future versions will use `/api/v2/*`.

---

## Support

**Issues:**
- GitHub: https://github.com/yourorg/black-pill/issues
- Email: api-support@blackpill.app

**Status:**
- https://status.blackpill.app

---

**Last Updated:** October 27, 2025

