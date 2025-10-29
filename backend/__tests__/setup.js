// Jest setup file
require('dotenv').config({ path: '.env.test' });

// Mock Supabase for tests
jest.mock('../utils/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          maybeSingle: jest.fn(),
          order: jest.fn(),
          range: jest.fn(),
          is: jest.fn(),
          gte: jest.fn(),
          not: jest.fn(),
        })),
        count: jest.fn(),
      })),
      insert: jest.fn(),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
      delete: jest.fn(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
    rpc: jest.fn(),
  },
}));

// Mock external services
jest.mock('../utils/openai-client', () => ({
  analyzeFacialAttractiveness: jest.fn(),
}));

jest.mock('../utils/google-vision', () => ({
  detectFaces: jest.fn(),
  checkSafeSearch: jest.fn(),
}));

jest.mock('stripe', () => {
  return jest.fn(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    subscriptions: {
      update: jest.fn(),
    },
    billingPortal: {
      sessions: {
        create: jest.fn(),
      },
    },
  }));
});

