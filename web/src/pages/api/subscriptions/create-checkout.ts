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
    // Hardcoded backend API URL
    const backendApiUrl = 'https://api.black-pill.app';
    
    console.log('Forwarding request to:', `${backendApiUrl}/api/subscriptions/create-checkout`);
    console.log('Request body:', req.body);
    
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

    console.log('Backend response status:', backendResponse.status);
    console.log('Backend response content-type:', backendResponse.headers.get('content-type'));

    // Check if response is JSON
    const contentType = backendResponse.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await backendResponse.json();
      return res.status(backendResponse.status).json(data);
    } else {
      // Backend returned non-JSON (probably HTML error page)
      const text = await backendResponse.text();
      console.error('Backend returned non-JSON response:', text.substring(0, 500));
      
      return res.status(500).json({
        error: 'Backend configuration error',
        message: 'The backend API is not configured correctly. Please check that api.black-pill.app is deployed and the Stripe environment variables are set.',
      });
    }
  } catch (error: any) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message || 'An error occurred while processing your request',
    });
  }
}

