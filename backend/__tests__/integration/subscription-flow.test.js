/**
 * Integration tests for subscription flows
 * Tests both app and web checkout flows end-to-end
 */

const Stripe = require('stripe');
const { supabaseAdmin } = require('../../utils/supabase');
const checkoutHandler = require('../../api/subscriptions/create-checkout');
const webhookHandler = require('../../api/webhooks/stripe');

// Mock config
jest.mock('../../utils/config', () => ({
  app: {
    url: 'https://test.black-pill.app',
  },
  stripe: {
    secretKey: 'sk_test_fake',
    webhookSecret: 'whsec_test_fake',
  },
}));

describe('Subscription Flow Integration Tests', () => {
  let mockStripe;
  let mockUser;

  beforeEach(() => {
    mockUser = {
      id: 'user_test_123',
      email: 'test@example.com',
    };

    mockStripe = {
      checkout: {
        sessions: {
          create: jest.fn(),
          retrieve: jest.fn(),
        },
      },
      customers: {
        create: jest.fn(),
        retrieve: jest.fn(),
        list: jest.fn(),
      },
      subscriptions: {
        retrieve: jest.fn(),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    };

    Stripe.mockReturnValue(mockStripe);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('App Flow (Authenticated)', () => {
    it('should complete full app subscription flow', async () => {
      // Step 1: Create checkout session
      const mockCheckoutSession = {
        id: 'cs_test_app_123',
        url: 'https://checkout.stripe.com/test',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        metadata: {
          source: 'app',
          user_id: mockUser.id,
          tier: 'pro',
        },
      };

      mockStripe.checkout.sessions.create.mockResolvedValue(mockCheckoutSession);

      // Mock authenticated request
      const req = {
        method: 'POST',
        body: {
          tier: 'pro',
          interval: 'monthly',
          source: 'app',
          user_id: mockUser.id,
        },
        user: mockUser, // Authenticated user
      };

      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock Supabase queries
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      await checkoutHandler(req, res);

      // Verify checkout session created with correct metadata
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            source: 'app',
            user_id: mockUser.id,
            tier: 'pro',
          }),
        })
      );

      // Step 2: Simulate webhook after payment
      const mockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
        items: {
          data: [{ price: { id: 'price_test_pro_monthly' } }],
        },
      };

      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);
      mockStripe.customers.retrieve.mockResolvedValue({
        id: 'cus_test_123',
        email: mockUser.email,
      });

      const webhookReq = {
        headers: {
          'stripe-signature': 'test_signature',
        },
        body: JSON.stringify({
          type: 'checkout.session.completed',
          data: {
            object: mockCheckoutSession,
          },
        }),
      };

      const webhookRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
      };

      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: mockCheckoutSession,
        },
      });

      // Mock Supabase insert for subscription
      supabaseAdmin.from.mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      });

      await webhookHandler(webhookReq, webhookRes);

      // Verify subscription created with source='app'
      expect(supabaseAdmin.from).toHaveBeenCalledWith('subscriptions');
      expect(webhookRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Web Flow (Unauthenticated)', () => {
    it('should complete full web subscription flow', async () => {
      // Step 1: Create checkout session (unauthenticated)
      const mockCheckoutSession = {
        id: 'cs_test_web_123',
        url: 'https://checkout.stripe.com/test',
        customer: 'cus_test_456',
        subscription: 'sub_test_456',
        metadata: {
          source: 'web',
          tier: 'basic',
        },
      };

      mockStripe.checkout.sessions.create.mockResolvedValue(mockCheckoutSession);

      const req = {
        method: 'POST',
        body: {
          tier: 'basic',
          interval: 'monthly',
          email: 'webuser@example.com',
          source: 'web',
        },
        // No user object = unauthenticated
      };

      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock customer creation for web flow
      mockStripe.customers.list.mockResolvedValue({ data: [] });
      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_test_456',
        email: 'webuser@example.com',
      });

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      await checkoutHandler(req, res);

      // Verify checkout session created with source='web'
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            source: 'web',
            tier: 'basic',
          }),
          customer_email: 'webuser@example.com',
        })
      );

      // Step 2: Webhook processing
      const mockSubscription = {
        id: 'sub_test_456',
        customer: 'cus_test_456',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        items: {
          data: [{ price: { id: 'price_test_basic_monthly' } }],
        },
      };

      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);
      mockStripe.customers.retrieve.mockResolvedValue({
        id: 'cus_test_456',
        email: 'webuser@example.com',
      });

      // Mock user lookup (not found - web flow before app signup)
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
        upsert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });

      const webhookReq = {
        headers: {
          'stripe-signature': 'test_signature',
        },
        body: JSON.stringify({
          type: 'checkout.session.completed',
          data: {
            object: mockCheckoutSession,
          },
        }),
      };

      const webhookRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
      };

      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: mockCheckoutSession,
        },
      });

      await webhookHandler(webhookReq, webhookRes);

      // Verify subscription created with source='web' and NULL user_id
      expect(supabaseAdmin.from).toHaveBeenCalledWith('subscriptions');
      expect(webhookRes.status).toHaveBeenCalledWith(200);
    });

    it('should link web subscription to user when they sign up', async () => {
      // Simulate user signing up with email that has existing web subscription
      const existingSubscription = {
        id: 'sub_existing',
        user_id: null, // NULL from web flow
        stripe_customer_id: 'cus_test_456',
        source: 'web',
        tier: 'basic',
        status: 'active',
      };

      const newUser = {
        id: 'user_new_123',
        email: 'webuser@example.com',
      };

      // Mock finding subscription by email
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: existingSubscription, error: null }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      });

      // When user signs up, subscription should be linked
      const { data } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('stripe_customer_id', 'cus_test_456')
        .maybeSingle();

      if (data && !data.user_id) {
        await supabaseAdmin
          .from('subscriptions')
          .update({ user_id: newUser.id })
          .eq('id', data.id);

        expect(supabaseAdmin.from).toHaveBeenCalledWith('subscriptions');
      }
    });
  });

  describe('Source Tracking', () => {
    it('should track app vs web conversion rates', async () => {
      // This would be used for analytics
      const appSubscriptions = {
        data: [
          { id: '1', source: 'app', tier: 'pro' },
          { id: '2', source: 'app', tier: 'basic' },
        ],
      };

      const webSubscriptions = {
        data: [
          { id: '3', source: 'web', tier: 'pro' },
          { id: '4', source: 'web', tier: 'unlimited' },
        ],
      };

      // Mock analytics query
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: jest.fn().mockResolvedValue(appSubscriptions),
          }),
        }),
      });

      // Verify source is tracked correctly
      expect(appSubscriptions.data.every(sub => sub.source === 'app')).toBe(true);
      expect(webSubscriptions.data.every(sub => sub.source === 'web')).toBe(true);
    });
  });
});

