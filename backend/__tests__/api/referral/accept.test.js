const { supabaseAdmin } = require('../../../utils/supabase');
const handler = require('../../../api/referral/accept');

describe('POST /api/referral/accept', () => {
  let req, res;

  beforeEach(() => {
    req = {
      method: 'POST',
      body: {
        referral_code: 'INVITE-1234-5678',
      },
      user: {
        id: 'test-user-id',
      },
      ip: '192.168.1.1',
      headers: {
        'user-agent': 'test-agent',
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

  it('should return 400 if referral code is missing', async () => {
    req.body.referral_code = undefined;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Referral code required',
    });
  });

  it('should return 400 if referral code format is invalid', async () => {
    req.body.referral_code = 'INVALID-CODE';

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid referral code format',
    });
  });

  it('should return 404 if referral code not found', async () => {
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Referral code not found',
    });
  });

  it('should return 409 if user already used a referral', async () => {
    const mockUser = {
      id: 'test-user-id',
      referred_by: 'existing-referrer-id',
    };

    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: mockUser,
            error: null,
          }),
        }),
      }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Referral already used',
      message: 'You have already used a referral code',
    });
  });

  it('should accept referral successfully', async () => {
    const mockReferral = {
      id: 'ref-123',
      from_user_id: 'referrer-id',
      bonus_scans_given: 5,
    };

    const mockReferrer = {
      id: 'referrer-id',
      username: 'referrer',
    };

    const mockUser = {
      id: 'test-user-id',
      referred_by: null,
      scans_remaining: 1,
    };

    // Mock referral lookup
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: mockReferral,
            error: null,
          }),
        }),
      }),
    });

    // Mock user lookup (to check if already referred)
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: mockUser,
            error: null,
          }),
        }),
      }),
    });

    // Mock referrer lookup
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockReferrer,
            error: null,
          }),
        }),
      }),
    });

    // Mock updates
    supabaseAdmin.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      bonus_scans: 5,
      referrer_name: 'referrer',
      message: expect.any(String),
    });
  });
});

