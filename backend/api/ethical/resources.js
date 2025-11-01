/**
 * GET /api/ethical/resources
 * Get mental health resources (always available, no auth required)
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

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    resources: MENTAL_HEALTH_RESOURCES,
  });
};

