const { verifyAuth } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rate-limit');
const { supabaseAdmin } = require('../../utils/supabase');
const config = require('../../utils/config');

/**
 * GET /api/share/generate-card
 * Generate share card image for analysis
 */
module.exports = async (req, res) => {
  await verifyAuth(req, res, async () => {
    await createRateLimiter('share')(req, res, async () => {
      try {
        const { analysis_id } = req.query;

        if (!analysis_id) {
          return res.status(400).json({
            error: 'Missing analysis_id',
          });
        }

        // Get analysis
        const { data: analysis, error } = await supabaseAdmin
          .from('analyses')
          .select('*')
          .eq('id', analysis_id)
          .eq('user_id', req.user.id)
          .single();

        if (error || !analysis) {
          return res.status(404).json({
            error: 'Analysis not found',
          });
        }

        // Get user's referral code
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('referral_code')
          .eq('id', req.user.id)
          .single();

        // In a production environment, you would generate the image here
        // using Puppeteer or similar server-side rendering
        // For now, we'll return the data needed to generate the card client-side
        // or you can implement server-side generation with Puppeteer

        const shareData = {
          analysis_id: analysis.id,
          score: analysis.score,
          breakdown: analysis.breakdown,
          referral_code: user?.referral_code || '',
          share_url: `${config.app.url}/ref/${user?.referral_code}`,
          image_url: analysis.image_url, // For background/preview
        };

        // Log the share event
        await supabaseAdmin
          .from('share_logs')
          .insert({
            user_id: req.user.id,
            analysis_id: analysis.id,
            platform: 'generated',
          });

        res.status(200).json(shareData);

        // TODO: Implement actual image generation with Puppeteer
        // const imageBuffer = await generateShareCardImage(shareData);
        // const fileName = `share-cards/${analysis_id}.png`;
        // await supabaseAdmin.storage.from('analyses').upload(fileName, imageBuffer);
        // return { image_url: publicUrl, share_url: ... }

      } catch (error) {
        console.error('Share card generation error:', error);
        res.status(500).json({
          error: 'Failed to generate share card',
          message: error.message,
        });
      }
    });
  });
};

