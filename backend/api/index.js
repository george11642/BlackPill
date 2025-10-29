/**
 * GET /api
 * Root API endpoint - health check and API documentation
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'ok',
    name: 'Black Pill Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/me',
      creators: {
        dashboard: 'GET /api/creators/dashboard',
        performance: 'GET /api/creators/performance',
        apply: 'POST /api/creators/apply',
        coupons: 'GET /api/creators/coupons',
      },
      leaderboard: 'GET /api/leaderboard',
      analyses: 'GET /api/analyses',
      analyze: 'POST /api/analyze',
    },
    docs: 'https://github.com/your-org/black-pill#api-documentation',
  });
};
