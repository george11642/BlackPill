const { verifyAuth } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rate-limit');
const { supabaseAdmin } = require('../../utils/supabase');
const config = require('../../utils/config');
const { generateShareCardImage } = require('../../utils/share-card-generator-og');
const { v4: uuidv4 } = require('uuid');

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

        // Prepare share data
        const shareData = {
          analysis_id: analysis.id,
          score: parseFloat(analysis.score),
          breakdown: analysis.breakdown || {},
          referral_code: user?.referral_code || '',
          share_url: `${config.app.url}/ref/${user?.referral_code}`,
          image_url: analysis.image_url,
        };

        // Generate share card PNG image (1080x1920px) using Vercel OG
        const imageArrayBuffer = await generateShareCardImage(shareData);
        const imageBuffer = Buffer.from(imageArrayBuffer);

        // Upload to Supabase Storage
        const fileName = `share-cards/${analysis.id}.png`;
        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('analyses')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            cacheControl: '604800', // Cache for 7 days as per PRD
            upsert: true, // Overwrite if exists
          });

        if (uploadError) {
          throw new Error(`Failed to upload share card: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin
          .storage
          .from('analyses')
          .getPublicUrl(fileName);

        // Log the share event
        await supabaseAdmin
          .from('share_logs')
          .insert({
            user_id: req.user.id,
            analysis_id: analysis.id,
            platform: 'generated',
          });

        // Return share card URL
        res.status(200).json({
          image_url: urlData.publicUrl,
          share_url: shareData.share_url,
          analysis_id: analysis.id,
        });

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

