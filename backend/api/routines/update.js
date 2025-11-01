const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * PUT /api/routines/update
 * Update routine details
 */
module.exports = async (req, res) => {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { routine_id, name, goal, focus_categories, is_active } = req.body;

      if (!routine_id) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'routine_id is required',
        });
      }

      // Verify routine belongs to user
      const { data: routine, error: routineError } = await supabaseAdmin
        .from('routines')
        .select('id')
        .eq('id', routine_id)
        .eq('user_id', userId)
        .single();

      if (routineError || !routine) {
        return res.status(403).json({
          error: 'Unauthorized',
          message: 'You do not have access to this routine',
        });
      }

      // Build update object
      const updates = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) updates.name = name;
      if (goal !== undefined) updates.goal = goal;
      if (focus_categories !== undefined) updates.focus_categories = focus_categories;
      if (is_active !== undefined) updates.is_active = is_active;

      // Update routine
      const { data: updatedRoutine, error: updateError } = await supabaseAdmin
        .from('routines')
        .update(updates)
        .eq('id', routine_id)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Routine update error:', updateError);
        throw updateError;
      }

      return res.status(200).json({
        routine: updatedRoutine,
      });
    } catch (error) {
      console.error('Update routine error:', error);
      return res.status(500).json({
        error: 'Failed to update routine',
        message: error.message,
      });
    }
  });
};

