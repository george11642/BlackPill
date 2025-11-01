const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * POST /api/wellness/sync
 * Sync wellness data from wearables (Apple Health, Google Fit)
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const {
        date,
        sleep_hours,
        sleep_quality,
        sleep_source,
        hydration_ounces,
        hydration_goal,
        hydration_source,
        hrv,
        resting_hr,
        stress_level,
        stress_source,
        exercise_minutes,
        exercise_intensity,
        exercise_type,
        exercise_calories,
        exercise_source,
        calories_consumed,
        protein_grams,
        water_intake,
        nutrition_source,
      } = req.body;

      if (!date) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'date is required',
        });
      }

      // Upsert wellness data
      const { data: wellnessData, error } = await supabaseAdmin
        .from('user_wellness_data')
        .upsert(
          {
            user_id: userId,
            date: date,
            sleep_hours: sleep_hours || null,
            sleep_quality: sleep_quality || null,
            sleep_source: sleep_source || null,
            hydration_ounces: hydration_ounces || null,
            hydration_goal: hydration_goal || null,
            hydration_source: hydration_source || null,
            hrv: hrv || null,
            resting_hr: resting_hr || null,
            stress_level: stress_level || null,
            stress_source: stress_source || null,
            exercise_minutes: exercise_minutes || null,
            exercise_intensity: exercise_intensity || null,
            exercise_type: exercise_type || null,
            exercise_calories: exercise_calories || null,
            exercise_source: exercise_source || null,
            calories_consumed: calories_consumed || null,
            protein_grams: protein_grams || null,
            water_intake: water_intake || null,
            nutrition_source: nutrition_source || null,
          },
          {
            onConflict: 'user_id,date',
          }
        )
        .select()
        .single();

      if (error) {
        console.error('Wellness sync error:', error);
        throw error;
      }

      return res.status(200).json({
        wellnessData,
      });
    } catch (error) {
      console.error('Sync wellness data error:', error);
      return res.status(500).json({
        error: 'Failed to sync wellness data',
        message: error.message,
      });
    }
  });
};

