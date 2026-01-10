# Testing

## Current State

**No formal testing infrastructure exists in this codebase.**

### What's Missing
- No Jest/Vitest configuration
- No React Testing Library setup
- No E2E testing (Cypress/Playwright)
- No test files (`*.test.ts`, `*.spec.ts`)
- No `__tests__/` directories
- No test scripts in `package.json`

### Current npm Scripts

**Mobile:**
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web"
  }
}
```

**Web:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "npm run build:expo && next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

## Quality Assurance (Current)

### TypeScript
- Mobile: `strict: true` (strong type checking)
- Web: `strict: false` (relaxed checking)

### Linting
- ESLint v9 in web project
- No ESLint in mobile projects
- No Prettier config file (just dependency)

### Runtime Validation
- Try-catch blocks in API calls
- ErrorBoundary component for React errors
- Custom `ApiError` class for error handling

### Console Logging
- Prefixed logging for debugging: `[API]`, `[Auth]`, `[Supabase]`
- ~236 console statements across lib directories

## Recommended Testing Setup

### Unit Testing (Mobile)
```bash
npm install -D jest @testing-library/react-native jest-expo
```

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Unit Testing (Web)
```bash
npm install -D vitest @testing-library/react jsdom
```

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

### E2E Testing
```bash
npm install -D @playwright/test
```

## Priority Test Areas

### High Priority (Critical Paths)
1. **Authentication Flow**
   - Login/signup functionality
   - Session persistence
   - Apple/Google OAuth

2. **API Client**
   - Route matching logic
   - Supabase vs Edge Function routing
   - Error handling

3. **Subscription Context**
   - Tier feature gating
   - Scan limit enforcement
   - RevenueCat integration

### Medium Priority
1. **Analysis Components**
   - Score display
   - Breakdown rendering

2. **Routine Logic**
   - Task completion
   - Streak calculation

3. **Form Validation**
   - Input validation
   - Error states

### Low Priority
1. **UI Components**
   - GlassCard, PrimaryButton variants
   - Theme application

## Mocking Patterns (Future)

### Supabase Mock
```typescript
jest.mock('../lib/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null })
      })
    })
  }
}));
```

### API Client Mock
```typescript
jest.mock('../lib/api/client', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));
```

## Test File Locations (Recommended)

```
mobile/
├── __tests__/
│   ├── components/
│   │   └── GlassCard.test.tsx
│   ├── screens/
│   │   └── LoginScreen.test.tsx
│   └── lib/
│       ├── api/
│       │   └── client.test.ts
│       └── auth/
│           └── context.test.tsx

web/
├── __tests__/
│   ├── components/
│   └── lib/
```
