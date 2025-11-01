const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * DELETE /api/routines/delete
 * Delete a routine (and all associated tasks, completions, streaks)
 */
module.exports = async (req, res) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await verifyAuth(req, res, async () => {
    try {
      const userId = req.user.id;
      const { routine_id } = req.query;

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

      // Delete routine (cascade will delete tasks, completions, streaks)
      const { error: deleteError } = await supabaseAdmin
        .from('routines')
        .delete()
        .eq('id', routine_id)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Routine delete error:', deleteError);
        throw deleteError;
      }

      return res.status(200).json({
        success: true,
        message: 'Routine deleted successfully',
      });
    } catch (error) {
      console.error('Delete routine error:', error);
      return res.status(500).json({
        error: 'Failed to delete routine',
        message: error.message,
      });
    }
  });
};

