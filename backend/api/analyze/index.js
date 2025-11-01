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
            const { data: thumbUploadData, error: thumbUploadError } = await supabaseAdmin
              .storage
              .from('analyses')
              .upload(thumbnailFileName, thumbnail, {
                contentType: 'image/jpeg',
              });

            let thumbnailUrl = null;
            if (thumbUploadError) {
              console.error('Thumbnail upload error:', thumbUploadError);
              // Continue without thumbnail rather than failing the entire request
            } else {
              const { data: thumbUrlData } = supabaseAdmin
                .storage
                .from('analyses')
                .getPublicUrl(thumbnailFileName);
              thumbnailUrl = thumbUrlData.publicUrl;
            }

            // Save analysis to database
            const { data: analysis, error: dbError } = await supabaseAdmin
              .from('analyses')
              .insert({
                user_id: req.user.id,
                image_url: imageUrl,
                image_thumbnail_url: thumbnailUrl,
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
              // Get current total_scans_used to increment it
              const { data: currentUser } = await supabaseAdmin
                .from('users')
                .select('total_scans_used')
                .eq('id', req.user.id)
                .single();

              const currentTotalScans = (currentUser?.total_scans_used || 0);

              await supabaseAdmin
                .from('users')
                .update({
                  scans_remaining: req.scansRemaining - 1,
                  total_scans_used: currentTotalScans + 1,
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
            console.error('Analysis error:', {
              error: error.message,
              stack: error.stack,
              user_id: req.user?.id,
              endpoint: req.path,
            });

            // Determine if this is a client error (4xx) or server error (5xx)
            const isClientError = error.message.includes('No face detected') ||
                                 error.message.includes('Multiple faces') ||
                                 error.message.includes('blurred') ||
                                 error.message.includes('under-exposed') ||
                                 error.message.includes('Face angle') ||
                                 error.message.includes('confidence is too low') ||
                                 error.message.includes('inappropriate content') ||
                                 error.message.includes('Invalid');

            const statusCode = isClientError ? 400 : 500;
            const errorMessage = isClientError 
              ? error.message 
              : 'Our servers encountered an error processing your photo. Please try again in a moment.';

            res.status(statusCode).json({
              error: isClientError ? 'Invalid photo' : 'Analysis failed',
              message: errorMessage,
              ...(process.env.NODE_ENV === 'development' && { details: error.message }),
            });
          }
        });
      });
    });
  });
};

