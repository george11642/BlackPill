const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');

/**
 * POST /api/community/vote
 * Upvote or downvote an analysis or comment
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    try {
      const { voteable_type, voteable_id, vote_type } = req.body;

      // Validate input
      if (!['analysis', 'comment'].includes(voteable_type)) {
        return res.status(400).json({ error: 'Invalid voteable_type' });
      }

      if (!['upvote', 'downvote'].includes(vote_type)) {
        return res.status(400).json({ error: 'Invalid vote_type' });
      }

      // Check if user already voted
      const { data: existingVote } = await supabaseAdmin
        .from('votes')
        .select('*')
        .eq('voteable_type', voteable_type)
        .eq('voteable_id', voteable_id)
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.vote_type === vote_type) {
          // Remove vote (un-vote)
          await supabaseAdmin
            .from('votes')
            .delete()
            .eq('id', existingVote.id);

          return res.status(200).json({
            success: true,
            action: 'removed',
          });
        } else {
          // Update vote (change from upvote to downvote or vice versa)
          await supabaseAdmin
            .from('votes')
            .update({ vote_type })
            .eq('id', existingVote.id);

          return res.status(200).json({
            success: true,
            action: 'updated',
          });
        }
      }

      // Create new vote
      const { data: vote, error: voteError } = await supabaseAdmin
        .from('votes')
        .insert({
          voteable_type,
          voteable_id,
          user_id: req.user.id,
          vote_type,
        })
        .select()
        .single();

      if (voteError) {
        throw voteError;
      }

      // Update like_count if voting on analysis
      if (voteable_type === 'analysis' && vote_type === 'upvote') {
        await supabaseAdmin.rpc('increment_like_count', {
          analysis_id: voteable_id,
        });
      }

      res.status(201).json({
        success: true,
        action: 'created',
        vote,
      });

    } catch (error) {
      console.error('Vote error:', error);
      res.status(500).json({
        error: 'Failed to process vote',
        message: error.message,
      });
    }
  });
};

