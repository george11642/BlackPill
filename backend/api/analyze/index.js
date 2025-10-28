const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { verifyAuth, checkScansRemaining } = require('../../middleware/auth');
const { analyzeRateLimiter } = require('../../middleware/rate-limit');
const { supabaseAdmin } = require('../../utils/supabase');
const { detectFaces, checkSafeSearch } = require('../../utils/google-vision');
const { analyzeFacialAttractiveness } = require('../../utils/openai-client');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * POST /api/analyze
 * Analyze a facial photo
 */
module.exports = async (req, res) => {
  // Apply middleware
  await verifyAuth(req, res, async () => {
    await checkScansRemaining(req, res, async () => {
      await analyzeRateLimiter(req, res, async () => {
        // Handle file upload
        upload.single('image')(req, res, async (err) => {
          if (err) {
            return res.status(400).json({
              error: 'File upload error',
              message: err.message,
            });
          }

          if (!req.file) {
            return res.status(400).json({
              error: 'No image provided',
              message: 'Please upload an image file',
            });
          }

          try {
            // Process image
            const processedImage = await sharp(req.file.buffer)
              .resize(1920, 1920, {
                fit: 'inside',
                withoutEnlargement: true,
              })
              .jpeg({ quality: 85 })
              .toBuffer();

            // Upload to Supabase Storage
            const fileName = `${req.user.id}/${uuidv4()}.jpg`;
            const { data: uploadData, error: uploadError } = await supabaseAdmin
              .storage
              .from('analyses')
              .upload(fileName, processedImage, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
              });

            if (uploadError) {
              throw new Error(`Failed to upload image: ${uploadError.message}`);
            }

            // Get public URL
            const { data: urlData } = supabaseAdmin
              .storage
              .from('analyses')
              .getPublicUrl(fileName);

            const imageUrl = urlData.publicUrl;

            // Check for explicit content
            await checkSafeSearch(imageUrl);

            // Detect faces
            const faceMetrics = await detectFaces(imageUrl);

            // Analyze with AI
            const analysisResult = await analyzeFacialAttractiveness(
              imageUrl,
              faceMetrics
            );

            // Create thumbnail
            const thumbnail = await sharp(processedImage)
              .resize(200, 200, {
                fit: 'cover',
              })
              .jpeg({ quality: 80 })
              .toBuffer();

            const thumbnailFileName = `${req.user.id}/${uuidv4()}-thumb.jpg`;
            await supabaseAdmin
              .storage
              .from('analyses')
              .upload(thumbnailFileName, thumbnail, {
                contentType: 'image/jpeg',
              });

            const { data: thumbUrlData } = supabaseAdmin
              .storage
              .from('analyses')
              .getPublicUrl(thumbnailFileName);

            // Save analysis to database
            const { data: analysis, error: dbError } = await supabaseAdmin
              .from('analyses')
              .insert({
                user_id: req.user.id,
                image_url: imageUrl,
                image_thumbnail_url: thumbUrlData.publicUrl,
                score: analysisResult.score,
                breakdown: analysisResult.breakdown,
                tips: analysisResult.tips,
              })
              .select()
              .single();

            if (dbError) {
              throw new Error(`Failed to save analysis: ${dbError.message}`);
            }

            // Decrement scans remaining (unless unlimited)
            if (req.userTier !== 'unlimited') {
              await supabaseAdmin
                .from('users')
                .update({
                  scans_remaining: req.scansRemaining - 1,
                  total_scans_used: supabaseAdmin.rpc('increment', { row_id: req.user.id }),
                })
                .eq('id', req.user.id);
            }

            // Get updated scans remaining
            const { data: userData } = await supabaseAdmin
              .from('users')
              .select('scans_remaining')
              .eq('id', req.user.id)
              .single();

            // Return response
            res.status(200).json({
              analysis_id: analysis.id,
              score: analysis.score,
              breakdown: analysis.breakdown,
              tips: analysis.tips,
              scans_remaining: userData?.scans_remaining || 0,
            });

          } catch (error) {
            console.error('Analysis error:', error);
            res.status(500).json({
              error: 'Analysis failed',
              message: error.message,
            });
          }
        });
      });
    });
  });
};

