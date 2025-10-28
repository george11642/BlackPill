const { supabase } = require('../utils/supabase');

/**
 * Verify JWT token from Supabase Auth
 */
async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    // Attach user to request
    req.user = data.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
}

/**
 * Check if user has sufficient scans remaining
 */
async function checkScansRemaining(req, res, next) {
  try {
    const { supabaseAdmin } = require('../utils/supabase');
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('scans_remaining, tier')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Check if unlimited tier
    if (user.tier === 'unlimited') {
      req.userTier = user.tier;
      return next();
    }

    // Check scans remaining
    if (user.scans_remaining <= 0) {
      return res.status(403).json({
        error: 'Insufficient scans',
        message: 'You have no scans remaining. Please upgrade or refer friends.',
      });
    }

    req.userTier = user.tier;
    req.scansRemaining = user.scans_remaining;
    next();
  } catch (error) {
    console.error('Check scans error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
    });
  }
}

module.exports = {
  verifyAuth,
  checkScansRemaining,
};

