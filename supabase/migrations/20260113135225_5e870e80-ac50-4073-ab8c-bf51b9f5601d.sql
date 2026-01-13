-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule daily quote push at 7 AM Eastern Time (12:00 UTC during EST, 11:00 UTC during EDT)
-- Using 12:00 UTC as a reasonable approximation for 7 AM ET
SELECT cron.schedule(
  'push-daily-inspirational-quote',
  '0 12 * * *', -- Every day at 12:00 UTC (7 AM ET)
  $$
  SELECT net.http_post(
    url := 'https://rjlqmfthemfpetpcydog.supabase.co/functions/v1/push-daily-quote',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);