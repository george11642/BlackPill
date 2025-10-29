const { supabaseAdmin } = require('../../../utils/supabase');
const handler = require('../../../api/auth/me');

// Mock middleware - verifyAuth calls the callback immediately
jest.mock('../../../middleware/auth', () => ({
  verifyAuth: jest.fn((req, res, callback) => {
    // Skip auth and call the handler callback directly
    callback();
  }),
}));

describe('GET /api/auth/me', () => {
  let req, res;

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
      username: 'testuser',
      avatar_url: null,
      bio: null,
      location: null,
    };

    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
        }),
      }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUser);
  });

  it('should return 404 if user not found', async () => {
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        }),
      }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User not found',
    });
  });
});

