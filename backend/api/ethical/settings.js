const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * GET /api/ethical/settings
 * Get user's ethical settings
 * 
 * PUT /api/ethical/settings
 * Update user's ethical settings
 */
module.exports = async (req, res) => {
  if (req.method === 'GET') {
    await verifyAuth(req, res, async () => {
      try {
        const userId = req.user.id;

        // Get user settings or return defaults
        const { data: settings, error } = await supabaseAdmin
          .from('user_ethical_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" - which is fine, we'll return defaults
          console.error('Settings fetch error:', error);
          throw error;
        }

        // Return settings or defaults
        const defaultSettings = {
          age_estimation: true,
          ethnicity_detection: false,
          body_type_inferences: true,
          advanced_features: true,
          disclaimers_acknowledged: false,
          enable_wellness_checks: true,
          check_frequency: 'weekly',
          show_resources_on_low_scores: true,
        };

        return res.status(200).json({
          settings: settings || defaultSettings,
        });
      } catch (error) {
        console.error('Get ethical settings error:', error);
        return res.status(500).json({
          error: 'Failed to fetch ethical settings',
          message: error.message,
        });
      }
    });
  } else if (req.method === 'PUT') {
    await verifyAuth(req, res, async () => {
      try {
        const userId = req.user.id;
        const {
          age_estimation,
          ethnicity_detection,
          body_type_inferences,
          advanced_features,
          disclaimers_acknowledged,
          enable_wellness_checks,
          check_frequency,
          show_resources_on_low_scores,
        } = req.body;

        // Validate check_frequency if provided
        if (check_frequency && !['weekly', 'biweekly', 'monthly'].includes(check_frequency)) {
          return res.status(400).json({
            error: 'Invalid check_frequency',
            message: 'Must be one of: weekly, biweekly, monthly',
          });
        }

        // Build update object
        const updates = {
          updated_at: new Date().toISOString(),
        };

        if (age_estimation !== undefined) updates.age_estimation = age_estimation;
        if (ethnicity_detection !== undefined) updates.ethnicity_detection = ethnicity_detection;
        if (body_type_inferences !== undefined) updates.body_type_inferences = body_type_inferences;
        if (advanced_features !== undefined) updates.advanced_features = advanced_features;
        if (disclaimers_acknowledged !== undefined) updates.disclaimers_acknowledged = disclaimers_acknowledged;
        if (enable_wellness_checks !== undefined) updates.enable_wellness_checks = enable_wellness_checks;
        if (check_frequency !== undefined) updates.check_frequency = check_frequency;
        if (show_resources_on_low_scores !== undefined) updates.show_resources_on_low_scores = show_resources_on_low_scores;

        // Upsert settings
        const { data: settings, error } = await supabaseAdmin
          .from('user_ethical_settings')
          .upsert(
            {
              user_id: userId,
              ...updates,
            },
            {
              onConflict: 'user_id',
            }
          )
          .select()
          .single();

        if (error) {
          console.error('Settings update error:', error);
          throw error;
        }

        return res.status(200).json({
          settings,
        });
      } catch (error) {
        console.error('Update ethical settings error:', error);
        return res.status(500).json({
          error: 'Failed to update ethical settings',
          message: error.message,
        });
      }
    });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

