/**
 * Root handler - GET /
 * Redirects to API documentation or serves welcome page
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Black Pill Backend API</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #0F0F1E 0%, #1A1A2E 100%);
          color: #fff;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .container {
          max-width: 700px;
          text-align: center;
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 60px 40px;
          backdrop-filter: blur(10px);
        }
        
        h1 {
          font-size: 3em;
          margin-bottom: 10px;
          background: linear-gradient(to right, #FF0080, #00D9FF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .subtitle {
          font-size: 1.2em;
          color: #B8BACC;
          margin-bottom: 40px;
        }
        
        .status {
          display: inline-block;
          background: #00FF41;
          color: #0F0F1E;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: bold;
          margin-bottom: 30px;
        }
        
        .endpoints {
          text-align: left;
          background: rgba(42, 42, 62, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 30px;
          margin: 30px 0;
        }
        
        .endpoints h3 {
          margin-bottom: 15px;
          color: #00D9FF;
        }
        
        .endpoint {
          margin: 12px 0;
          padding: 10px;
          background: rgba(15, 15, 30, 0.5);
          border-left: 3px solid #FF0080;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        
        .method {
          color: #00FF41;
          font-weight: bold;
        }
        
        .links {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 40px;
          flex-wrap: wrap;
        }
        
        a {
          display: inline-block;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .btn-primary {
          background: linear-gradient(to right, #FF0080, #00D9FF);
          color: white;
        }
        
        .btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }
        
        .btn-secondary {
          background: rgba(42, 42, 62, 0.8);
          color: #00D9FF;
          border: 1px solid rgba(0, 217, 255, 0.3);
        }
        
        .btn-secondary:hover {
          border-color: #00D9FF;
          background: rgba(42, 42, 62, 1);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎯 Black Pill</h1>
        <p class="subtitle">Backend API Server</p>
        
        <div class="status">✓ API Running</div>
        
        <div class="endpoints">
          <h3>🔧 Key Endpoints</h3>
          <div class="endpoint"><span class="method">GET</span> /api - API Documentation</div>
          <div class="endpoint"><span class="method">GET</span> /api/auth/me - Current User Info</div>
          <div class="endpoint"><span class="method">GET</span> /api/creators/dashboard - Creator Dashboard</div>
          <div class="endpoint"><span class="method">GET</span> /api/creators/performance - Performance Analytics</div>
          <div class="endpoint"><span class="method">POST</span> /api/analyze - Analyze Content</div>
          <div class="endpoint"><span class="method">GET</span> /api/leaderboard - Leaderboard Data</div>
        </div>
        
        <p style="color: #B8BACC; margin-bottom: 30px;">
          All endpoints require authentication via JWT token in Authorization header.
        </p>
        
        <div class="links">
          <a href="/api" class="btn-primary">View API Docs</a>
          <a href="https://github.com/your-org/black-pill" class="btn-secondary">GitHub</a>
        </div>
      </div>
    </body>
    </html>
  `);
};
