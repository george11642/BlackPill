import { Request } from 'next/server';
import { handleApiError, getRequestId, createResponseWithId } from '@/lib';

/**
 * Mental health resources (always available, no auth required)
 */
const MENTAL_HEALTH_RESOURCES = [
  {
    name: 'NAMI Helpline',
    phone: '1-800-950-6264',
    description: 'National Alliance on Mental Illness',
    available: 'Mon-Fri, 10am-10pm ET',
  },
  {
    name: 'Crisis Text Line',
    sms: 'Text HOME to 741741',
    description: '24/7 crisis support via text',
    available: '24/7',
  },
  {
    name: 'BDD Support',
    url: 'https://bdd.iocdf.org',
    description: 'Body Dysmorphic Disorder Foundation',
    available: 'Online resources',
  },
  {
    name: '7 Cups',
    url: 'https://www.7cups.com',
    description: 'Free emotional support chat',
    available: '24/7',
  },
  {
    name: 'BetterHelp',
    url: 'https://www.betterhelp.com',
    description: 'Professional online therapy',
    available: 'Paid service, financial aid available',
  },
];

/**
 * GET /api/ethical/resources
 * Get mental health resources (always available, no auth required)
 */
export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    return createResponseWithId(
      {
        resources: MENTAL_HEALTH_RESOURCES,
      },
      { status: 200 },
      requestId
    );
  } catch (error) {
    return handleApiError(error, request);
  }
}

