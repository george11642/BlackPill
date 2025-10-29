const { verifyAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../utils/supabase');
const { moderateContent } = require('../../utils/moderation');

/**
 * GET /api/community/comments?analysis_id=xxx
 * POST /api/community/comments
 * 
 * Get or post comments on analyses
 */
module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return getComments(req, res);
  } else if (req.method === 'POST') {
    return await verifyAuth(req, res, () => postComment(req, res));
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

/**
 * Get comments for an analysis
 */
async function getComments(req, res) {
  try {
    const { analysis_id } = req.query;
    
    if (!analysis_id) {
      return res.status(400).json({ error: 'analysis_id required' });
    }

    const { data: comments, error } = await supabaseAdmin
      .from('comments')
      .select(`
        *,
        users(username, avatar_url)
      `)
      .eq('analysis_id', analysis_id)
      .is('deleted_at', null)
      .eq('is_flagged', false)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    res.status(200).json({ comments: comments || [] });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      error: 'Failed to get comments',
      message: error.message,
    });
  }
}

/**
 * Post a new comment
 */
async function postComment(req, res) {
  try {
    const { analysis_id, content, parent_id } = req.body;

    if (!analysis_id || !content) {
      return res.status(400).json({ error: 'analysis_id and content required' });
    }

    // Check if analysis exists and is public
    const { data: analysis } = await supabaseAdmin
      .from('analyses')
      .select('is_public')
      .eq('id', analysis_id)
      .single();

    if (!analysis || !analysis.is_public) {
      return res.status(403).json({ error: 'Cannot comment on private analysis' });
    }

    // Moderate content using OpenAI Moderation API
    const moderationResult = await moderateContent(content);
    
    if (moderationResult.flagged) {
      return res.status(400).json({
        error: 'Comment contains inappropriate content',
        message: 'Your comment was flagged for: ' + moderationResult.categories.join(', '),
      });
    }

    // Create comment
    const { data: comment, error } = await supabaseAdmin
      .from('comments')
      .insert({
        analysis_id,
        user_id: req.user.id,
        content,
        parent_id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(comment);

  } catch (error) {
    console.error('Post comment error:', error);
    res.status(500).json({
      error: 'Failed to post comment',
      message: error.message,
    });
  }
}

