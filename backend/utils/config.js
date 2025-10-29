require('dotenv').config();

module.exports = {
  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-5-mini',
  },

  // Google Cloud
  google: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    apiKey: process.env.GOOGLE_CLOUD_API_KEY,
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL,
  },

  // App
  app: {
    url: process.env.APP_URL || 'https://black-pill.app',
    apiBaseUrl: process.env.API_BASE_URL || 'https://api.black-pill.app',
  },

  // Email
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },

  // Analytics (PostHog)
  posthog: {
    apiKey: process.env.POSTHOG_API_KEY,
    host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
  },

  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
};

