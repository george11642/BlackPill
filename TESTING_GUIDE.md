# Testing Guide - Black Pill Backend

## Quick Start

```bash
cd backend
npm install
npm test
```

## Test Structure

```
backend/
├── __tests__/
│   ├── setup.js                 # Jest setup and global mocks
│   ├── api/
│   │   ├── auth/
│   │   │   └── me.test.js
│   │   ├── referral/
│   │   │   ├── stats.test.js
│   │   │   └── accept.test.js
│   │   ├── subscriptions/
│   │   │   └── create-checkout.test.js
│   │   ├── analyses/
│   │   │   └── index.test.js
│   │   └── share/
│   │       └── generate-card.test.js
│   └── utils/
│       └── share-card-generator.test.js
├── jest.config.js               # Jest configuration
└── .env.test                    # Test environment variables
```

## Covered Endpoints

### ✅ Authentication
- `GET /api/auth/me` - Get current user profile

### ✅ Referrals
- `GET /api/referral/stats` - Get referral statistics
- `POST /api/referral/accept` - Accept referral code

### ✅ Subscriptions
- `POST /api/subscriptions/create-checkout` - Create Stripe checkout session

### ✅ Analyses
- `GET /api/analyses` - Get user's analyses

### ✅ Sharing
- `GET /api/share/generate-card` - Generate share card image

### ✅ Utils
- Share card image generator

## Running Tests

### Run All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### With Coverage Report
```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory.

## Writing New Tests

### Test Template

```javascript
const handler = require('../../../api/your-endpoint');

// Mock middleware
jest.mock('../../../middleware/auth', () => ({
  verifyAuth: jest.fn((req, res, next) => next()),
}));

describe('Your Endpoint', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      user: { id: 'test-user-id' },
      // ... other request properties
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle success case', async () => {
    // Arrange: Set up mocks
    // Act: Call handler
    await handler(req, res, next);
    // Assert: Verify behavior
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
```

## Mocking

### Supabase
Already mocked in `setup.js`. Access via:
```javascript
const { supabaseAdmin } = require('../../../utils/supabase');
```

### Stripe
Already mocked in `setup.js`. Import Stripe:
```javascript
const Stripe = require('stripe');
const mockStripe = Stripe();
```

### External APIs
Mock in your test file or `setup.js`:
```javascript
jest.mock('../../../utils/openai-client', () => ({
  analyzeFacialAttractiveness: jest.fn(),
}));
```

## Coverage Goals

Current threshold: **70%** (all metrics)
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

To increase to 80% (PRD requirement), add more tests for:
- Edge cases
- Error paths
- Validation scenarios

## CI/CD Integration

Add to `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm test
      - run: cd backend && npm run test:coverage
```

## Troubleshooting

### Tests failing due to auth middleware
Make sure to mock `verifyAuth`:
```javascript
jest.mock('../../../middleware/auth', () => ({
  verifyAuth: jest.fn((req, res, next) => next()),
}));
```

### Supabase mocks not working
Check that you're using the mocked `supabaseAdmin` from setup.js. If you need custom behavior, override in your test.

### Environment variables
Tests use `.env.test`. Create this file with test values:
```bash
NODE_ENV=test
SUPABASE_URL=https://test.supabase.co
# ... other vars
```

---

**Status**: ✅ Test suite ready! Run `npm test` to verify.

