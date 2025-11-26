# Supabase Cron Jobs Setup

This project uses Supabase pg_cron with pg_net to schedule recurring API calls instead of Vercel cron jobs.

## Prerequisites

1. Supabase project with `pg_cron` and `pg_net` extensions enabled (done via migration 022)
2. CRON_SECRET stored in Supabase Vault (already configured)

## Setup Steps

### 1. Verify Cron Jobs Are Scheduled

The migration automatically schedules the cron jobs. The CRON_SECRET has been stored in Vault for both projects.

The migration automatically schedules the cron jobs. Verify they exist:

```sql
SELECT * FROM cron.job;
```

You should see two jobs:
- `check-subscription-renewals` (runs daily at 00:00 UTC)
- `recalculate-leaderboard` (runs weekly on Sunday at 00:00 UTC)

### 2. CRON_SECRET Configuration

The CRON_SECRET is stored in Supabase Vault and is **required** for security. It has been automatically configured for both BlackPill and SmileScore projects.

This secret is stored in Vault and used by the cron functions. Make sure your environment variable `CRON_SECRET` matches the value stored in Supabase Vault.

### 3. Verify Cron Jobs

Check that cron jobs are scheduled:

```sql
SELECT * FROM cron.job;
```

Monitor cron job runs:

```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

## Cron Job Details

### check-subscription-renewals
- **Schedule**: Daily at 00:00 UTC (`0 0 * * *`)
- **Endpoint**: `/api/cron/check-renewals`
- **Purpose**: Checks for subscriptions renewing in 7 days and sends reminder emails

### recalculate-leaderboard
- **Schedule**: Weekly on Sunday at 00:00 UTC (`0 0 * * 0`)
- **Endpoint**: `/api/cron/recalculate-leaderboard`
- **Purpose**: Recalculates weekly leaderboard rankings

## Managing Cron Jobs

### List all cron jobs
```sql
SELECT * FROM cron.job;
```

### Unschedule a cron job
```sql
SELECT cron.unschedule('check-subscription-renewals');
SELECT cron.unschedule('recalculate-leaderboard');
```

### Update a cron job schedule
```sql
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'check-subscription-renewals'),
  schedule := '0 1 * * *' -- Change to 01:00 UTC
);
```

## Troubleshooting

### Cron jobs not running
1. Check if pg_cron scheduler is active:
```sql
SELECT * FROM pg_stat_activity WHERE application_name ILIKE 'pg_cron scheduler';
```

2. Check for errors in job run details:
```sql
SELECT * FROM cron.job_run_details 
WHERE status <> 'succeeded' 
ORDER BY start_time DESC 
LIMIT 10;
```

3. Verify CRON_SECRET is in Vault:
```sql
SELECT name, description FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET';
```

The secret should be present. If not, create it with your generated secret:
```sql
SELECT vault.create_secret('your-generated-secret-here', 'CRON_SECRET', 'Cron job authentication secret');
```

### API endpoint returns 401
- Verify the `CRON_SECRET` in Vault matches your environment variable
- Check that the Authorization header is being sent correctly

## Migration from Vercel Cron

The migration from Vercel cron to Supabase cron includes:
- ✅ Removed cron configuration from `vercel.json`
- ✅ Updated API routes to accept POST requests (instead of GET)
- ✅ Updated authentication to work with Supabase pg_net requests
- ✅ Created migration to enable required extensions

## Resources

- [Supabase Cron Documentation](https://supabase.com/docs/guides/cron)
- [pg_cron Extension](https://supabase.com/docs/guides/database/extensions/pgcron)
- [pg_net Extension](https://supabase.com/docs/guides/database/extensions/pgnet)

