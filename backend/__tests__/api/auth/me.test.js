const { supabaseAdmin } = require('../../../utils/supabase');
const handler = require('../../../api/auth/me');
const { verifyAuth } = require('../../../middleware/auth');

// Mock middleware
jest.mock('../../../middleware/auth', () => ({
  verifyAuth: jest.fn((req, res, next) => {
    // For tests, call next directly (skip auth)
    next();
  }),
}));

describe('GET /api/auth/me', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
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

  it('should return user profile successfully', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      tier: 'pro',
      scans_remaining: 10,
      referral_code: 'INVITE-1234-5678',
    };

    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
        }),
      }),
    });

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: mockUser.id,
      email: mockUser.email,
      tier: mockUser.tier,
      scans_remaining: mockUser.scans_remaining,
      referral_code: mockUser.referral_code,
    });
  });

  it('should return 404 if user not found', async () => {
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        }),
      }),
    });

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User not found',
    });
  });
});

