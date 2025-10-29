const { supabaseAdmin } = require('../../../utils/supabase');
const handler = require('../../../api/referral/stats');

// Mock middleware - verifyAuth calls the callback immediately
jest.mock('../../../middleware/auth', () => ({
  verifyAuth: jest.fn((req, res, callback) => callback()),
}));

describe('GET /api/referral/stats', () => {
  let req, res;

  beforeEach(() => {
    req = {
      method: 'GET',
      user: {
        id: 'test-user-id',
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

  it('should return referral statistics successfully', async () => {
    const mockUser = {
      referral_code: 'INVITE-1234-5678',
    };

    const mockReferrals = [
      {
        id: '1',
        status: 'accepted',
        bonus_scans_given: 5,
        accepted_at: new Date().toISOString(),
      },
      {
        id: '2',
        status: 'pending',
        bonus_scans_given: 0,
        accepted_at: null,
      },
      {
        id: '3',
        status: 'accepted',
        bonus_scans_given: 5,
        accepted_at: new Date().toISOString(),
      },
    ];

    // Mock user lookup
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
        }),
      }),
    });

    // Mock referrals lookup
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ data: mockReferrals, error: null }),
    });

    // Mock streak calculation referrals
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockReferrals.filter(r => r.status === 'accepted'),
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      referral_code: 'INVITE-1234-5678',
      total_invited: 3,
      accepted: 2,
      pending: 1,
      total_bonus_scans: 10,
      invite_streak: expect.any(Number),
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

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User not found',
    });
  });
});

