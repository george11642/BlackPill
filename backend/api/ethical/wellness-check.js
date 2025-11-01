const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * Mental health resources (always available)
 */
const MENTAL_HEALTH_RESOURCES = [
  {
    name: 'NAMI Helpline',
    phone: '1-800-950-6264',
    description: 'National Alliance on Mental Illness',
    available: 'Mon-Fri, 10am-10pm ET',
  },
  {
    name: 'Crisis Text Line',
    sms: 'Text HOME to 741741',
    description: '24/7 crisis support via text',
    available: '24/7',
  },
  {
    name: 'BDD Support',
    url: 'https://bdd.iocdf.org',
    description: 'Body Dysmorphic Disorder Foundation',
    available: 'Online resources',
  },
  {
    name: '7 Cups',
    url: 'https://www.7cups.com',
    description: 'Free emotional support chat',
    available: '24/7',
  },
  {
    name: 'BetterHelp',
    url: 'https://www.betterhelp.com',
    description: 'Professional online therapy',
    available: 'Paid service, financial aid available',
  },
];

/**
 * Check if wellness check should be triggered
 */
async function shouldShowWellnessCheck(userId) {
  // Get user settings
  const { data: settings } = await supabaseAdmin
    .from('user_ethical_settings')
    .select('enable_wellness_checks, check_frequency')
    .eq('user_id', userId)
    .single();

  if (!settings || !settings.enable_wellness_checks) {
    return { shouldShow: false, reason: null };
  }

  // Check recent analyses (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentAnalyses } = await supabaseAdmin
    .from('analyses')
    .select('score, created_at')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  // Trigger if: frequent scans (5+ in 7 days) OR low scores (3+ scores < 5.0)
  const scanCount = recentAnalyses?.length || 0;
  const lowScores = recentAnalyses?.filter((a) => parseFloat(a.score) < 5.0).length || 0;

  if (scanCount >= 5) {
    return {
      shouldShow: true,
      reason: 'frequent_scans',
      message: 'We noticed you\'ve been scanning frequently. Remember, your worth extends far beyond physical appearance. Take care of yourself.',
    };
  }

  if (lowScores >= 3) {
    return {
      shouldShow: true,
      reason: 'low_score',
      message: 'We understand that low scores can be difficult. Please remember these are algorithmic estimates, not absolute truth. Your value as a person extends far beyond appearance.',
    };
  }

  // Check if last wellness check was shown according to frequency
  const { data: lastCheck } = await supabaseAdmin
    .from('wellness_checks')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (lastCheck) {
    const daysSinceLastCheck = Math.floor(
      (new Date() - new Date(lastCheck.created_at)) / (1000 * 60 * 60 * 24)
    );

    const frequencyDays = {
      weekly: 7,
      biweekly: 14,
      monthly: 30,
    };

    if (daysSinceLastCheck < frequencyDays[settings.check_frequency || 'weekly']) {
      return { shouldShow: false, reason: null };
    }
  }

  return { shouldShow: false, reason: null };
}

/**
 * GET /api/ethical/wellness-check
 * Check if wellness intervention should be shown
 * 
 * POST /api/ethical/wellness-check
 * Record wellness check response
 */
module.exports = async (req, res) => {
  if (req.method === 'GET') {
    await verifyAuth(req, res, async () => {
      try {
        const userId = req.user.id;

        const checkResult = await shouldShowWellnessCheck(userId);

        if (!checkResult.shouldShow) {
          return res.status(200).json({
            shouldShow: false,
            resources: MENTAL_HEALTH_RESOURCES, // Always include resources
          });
        }

        return res.status(200).json({
          shouldShow: true,
          reason: checkResult.reason,
          message: checkResult.message,
          resources: MENTAL_HEALTH_RESOURCES,
        });
      } catch (error) {
        console.error('Wellness check error:', error);
        return res.status(500).json({
          error: 'Failed to check wellness status',
          message: error.message,
        });
      }
    });
  } else if (req.method === 'POST') {
    await verifyAuth(req, res, async () => {
      try {
        const userId = req.user.id;
        const { trigger_reason, message_shown, resources_accessed, user_response } = req.body;

        if (!trigger_reason || !message_shown) {
          return res.status(400).json({
            error: 'Invalid request',
            message: 'trigger_reason and message_shown are required',
          });
        }

        // Validate user_response if provided
        if (
          user_response &&
          !['dismissed', 'viewed_resources', 'contacted_support'].includes(user_response)
        ) {
          return res.status(400).json({
            error: 'Invalid user_response',
            message: 'Must be one of: dismissed, viewed_resources, contacted_support',
          });
        }

        // Record wellness check
        const { data: wellnessCheck, error } = await supabaseAdmin
          .from('wellness_checks')
          .insert({
            user_id: userId,
            trigger_reason,
            message_shown,
            resources_accessed: resources_accessed || false,
            user_response: user_response || null,
          })
          .select()
          .single();

        if (error) {
          console.error('Wellness check record error:', error);
          throw error;
        }

        return res.status(200).json({
          wellnessCheck,
        });
      } catch (error) {
        console.error('Record wellness check error:', error);
        return res.status(500).json({
          error: 'Failed to record wellness check',
          message: error.message,
        });
      }
    });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};


