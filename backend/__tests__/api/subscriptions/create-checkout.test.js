const Stripe = require('stripe');
const { supabaseAdmin } = require('../../../utils/supabase');
const handler = require('../../../api/subscriptions/create-checkout');

describe('POST /api/subscriptions/create-checkout', () => {
  let req, res;
  let mockStripe;

  beforeEach(() => {
    mockStripe = {
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
      customers: {
        create: jest.fn(),
        retrieve: jest.fn(),
        list: jest.fn(),
      },
    };

    Stripe.mockReturnValue(mockStripe);

    req = {
      method: 'POST',
      body: {
        tier: 'pro',
        interval: 'monthly',
        email: 'test@example.com',
        source: 'web',
      },
    };

    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      end: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle OPTIONS preflight request', async () => {
    req.method = 'OPTIONS';

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST, OPTIONS');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  it('should create checkout session for web user', async () => {
    process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_test_pro_monthly';

    const mockCheckoutSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    };

    mockStripe.checkout.sessions.create.mockResolvedValue(mockCheckoutSession);

    // Mock customer lookup (not found)
    mockStripe.customers.list.mockResolvedValue({ data: [] });
    mockStripe.customers.create.mockResolvedValue({ id: 'cus_test_123' });

    // Mock user lookup (not found for web flow)
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    await handler(req, res);

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      session_id: 'cs_test_123',
      checkout_url: 'https://checkout.stripe.com/test',
    });
  });

  it('should return 400 for invalid tier', async () => {
    req.body.tier = 'invalid';

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid tier',
      message: 'Tier must be basic, pro, or unlimited',
    });
  });

  it('should return 400 for missing email in web flow', async () => {
    req.body.email = undefined;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Email required',
      message: 'Email is required for web checkout flow',
    });
  });
});

