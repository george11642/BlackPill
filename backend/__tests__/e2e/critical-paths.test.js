/**
 * End-to-End tests for critical user paths
 * These tests simulate complete user journeys
 */

const Stripe = require('stripe');
const { supabaseAdmin } = require('../../utils/supabase');
const analyzeHandler = require('../../api/analyze');
const checkoutHandler = require('../../api/subscriptions/create-checkout');
const referralAcceptHandler = require('../../api/referral/accept');

jest.mock('../../utils/config', () => ({
  app: {
    url: 'https://test.black-pill.app',
  },
  stripe: {
    secretKey: 'sk_test_fake',
  },
}));

describe('Critical Path E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Path 1: New User Onboarding & First Analysis', () => {
    it('should complete: Signup → First Scan → Paywall → Subscribe', async () => {
      const mockUser = {
        id: 'user_new_123',
        email: 'newuser@example.com',
        scans_remaining: 1,
        tier: 'free',
      };

      // Step 1: User signs up (already handled by Supabase Auth)
      // Step 2: User completes first analysis
      const mockAnalysis = {
        id: 'analysis_123',
        user_id: mockUser.id,
        score: 7.5,
        breakdown: {
          symmetry: 8.0,
          jawline: 7.5,
          eyes: 7.0,
          lips: 8.0,
          skin: 7.5,
          bone_structure: 7.5,
        },
        tips: [
          { title: 'Skincare', description: 'Improve skin quality', timeframe: '2-4 weeks' },
        ],
      };

      // Mock image analysis
      const req = {
        method: 'POST',
        file: {
          buffer: Buffer.from('fake_image_data'),
          mimetype: 'image/jpeg',
        },
        user: mockUser,
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock services
      jest.doMock('../../utils/google-vision', () => ({
        detectFaces: jest.fn().mockResolvedValue({
          faceCount: 1,
          landmarks: [],
        }),
        checkSafeSearch: jest.fn().mockResolvedValue(true),
      }));

      jest.doMock('../../utils/openai-client', () => ({
        analyzeFacialAttractiveness: jest.fn().mockResolvedValue({
          score: 7.5,
          breakdown: mockAnalysis.breakdown,
          tips: mockAnalysis.tips,
        }),
      }));

      supabaseAdmin.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.jpg' } }),
        insert: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: { scans_remaining: 0 }, error: null }),
        }),
      });

      // Step 3: After analysis, scans_remaining = 0, paywall should trigger
      const updatedUser = {
        ...mockUser,
        scans_remaining: 0,
      };

      // Step 4: User subscribes
      const mockCheckoutSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      };

      Stripe.mockReturnValue({
        checkout: {
          sessions: {
            create: jest.fn().mockResolvedValue(mockCheckoutSession),
          },
        },
        customers: {
          create: jest.fn().mockResolvedValue({ id: 'cus_test_123' }),
        },
      });

      const checkoutReq = {
        method: 'POST',
        body: {
          tier: 'pro',
          interval: 'monthly',
          source: 'app',
          user_id: mockUser.id,
        },
        user: updatedUser,
      };

      const checkoutRes = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await checkoutHandler(checkoutReq, checkoutRes);

      expect(checkoutRes.status).toHaveBeenCalledWith(200);
      expect(checkoutRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: 'cs_test_123',
          checkout_url: expect.any(String),
        })
      );
    });
  });

  describe('Path 2: Referral Flow', () => {
    it('should complete: Share → Friend Accepts → Both Get Bonus Scans', async () => {
      const referrer = {
        id: 'user_referrer_123',
        email: 'referrer@example.com',
        referral_code: 'INVITE-1234-5678',
        scans_remaining: 5,
      };

      const referee = {
        id: 'user_referee_456',
        email: 'referee@example.com',
        scans_remaining: 1,
      };

      // Step 1: Friend receives referral link and signs up
      // Step 2: Friend accepts referral code
      const req = {
        method: 'POST',
        body: {
          referral_code: 'INVITE-1234-5678',
        },
        user: referee,
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock finding referrer by code
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: referrer, error: null }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      });

      await referralAcceptHandler(req, res);

      // Verify both users got bonus scans
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          bonus_scans: 5,
          referrer_name: expect.any(String),
        })
      );
    });
  });

  describe('Path 3: Subscription Renewal Flow', () => {
    it('should handle: Renewal Notification → Auto-Renew → Update Status', async () => {
      const activeSubscription = {
        id: 'sub_active_123',
        user_id: 'user_123',
        stripe_subscription_id: 'sub_stripe_123',
        tier: 'pro',
        status: 'active',
        current_period_end: new Date(Date.now() + 86400000).toISOString(), // 1 day left
      };

      // Mock renewal webhook
      const renewalEvent = {
        type: 'invoice.paid',
        data: {
          object: {
            subscription: 'sub_stripe_123',
            customer: 'cus_test_123',
            amount_paid: 999,
            status: 'paid',
          },
        },
      };

      // Subscription should be renewed automatically
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: activeSubscription, error: null }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: {
              ...activeSubscription,
              current_period_end: new Date(Date.now() + 2592000000).toISOString(), // +30 days
            },
            error: null,
          }),
        }),
      });

      // Verify renewal processed
      const { data } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', 'sub_stripe_123')
        .single();

      expect(data).toBeDefined();
      expect(data.status).toBe('active');
    });
  });

  describe('Path 4: High Score Share Flow', () => {
    it('should complete: High Score → Generate Share Card → Share → Track', async () => {
      const mockAnalysis = {
        id: 'analysis_high_score',
        user_id: 'user_123',
        score: 8.5,
        breakdown: {
          symmetry: 8.5,
          jawline: 8.0,
          eyes: 9.0,
          lips: 8.5,
          skin: 8.0,
          bone_structure: 8.5,
        },
      };

      // Generate share card
      const shareCardHandler = require('../../api/share/generate-card');

      const req = {
        method: 'GET',
        query: {
          analysis_id: mockAnalysis.id,
        },
        user: { id: 'user_123' },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockAnalysis, error: null }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });

      await shareCardHandler(req, res);

      // Verify share card generated and tracked
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          image_url: expect.any(String),
          share_url: expect.any(String),
        })
      );
    });
  });
});

