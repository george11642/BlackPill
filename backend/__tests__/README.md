# Backend Unit Tests

## Overview

This directory contains unit tests for critical backend API endpoints using Jest.

## Test Coverage

### ✅ Covered Endpoints

1. **Authentication**
   - `GET /api/auth/me` - User profile retrieval

2. **Referrals**
   - `GET /api/referral/stats` - Referral statistics
   - `POST /api/referral/accept` - Accept referral code

3. **Subscriptions**
   - `POST /api/subscriptions/create-checkout` - Stripe checkout creation

4. **Analyses**
   - `GET /api/analyses` - Get user analyses

5. **Sharing**
   - `GET /api/share/generate-card` - Share card generation

6. **Utils**
   - Share card image generator

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are organized by API endpoint:
```
__tests__/
├── setup.js                    # Jest configuration and mocks
├── api/
│   ├── auth/
│   │   └── me.test.js
│   ├── referral/
│   │   ├── stats.test.js
│   │   └── accept.test.js
│   ├── subscriptions/
│   │   └── create-checkout.test.js
│   ├── analyses/
│   │   └── index.test.js
│   └── share/
│       └── generate-card.test.js
└── utils/
    └── share-card-generator.test.js
```

## Mocking

- **Supabase**: Mocked Supabase client to avoid database calls
- **Stripe**: Mocked Stripe SDK for testing payment flows
- **External APIs**: OpenAI and Google Vision are mocked

## Coverage Goals

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Notes

- Tests use `.env.test` for environment variables
- All external services are mocked
- Tests run in Node.js environment (not browser)
- Each test file is isolated with `beforeEach` and `afterEach` cleanup

