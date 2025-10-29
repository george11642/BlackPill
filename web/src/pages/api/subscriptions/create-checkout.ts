import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * POST /api/subscriptions/create-checkout
 * Proxy route that forwards subscription checkout requests to backend API
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get backend API URL from environment variable
    const backendApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://black-pill.app';
    
    // Forward request to backend API
    const backendResponse = await fetch(`${backendApiUrl}/api/subscriptions/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present (for app flow)
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      },
      body: JSON.stringify(req.body),
    });

    // Get response data
    const data = await backendResponse.json();

    // Forward status code and response
    res.status(backendResponse.status).json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message || 'An error occurred while processing your request',
    });
  }
}

