# 💰 Anthropic API Balance Monitor

Automated system to monitor your Anthropic API balance and alert you when it drops below $5.

## ⚠️ Important Note

**Anthropic API Balance Endpoint**: As of February 2026, Anthropic doesn't provide a public API endpoint to check account balance programmatically. This monitor includes three approaches:

### Approach 1: OpenRouter Proxy (Recommended)
If you're using OpenRouter to access Anthropic, this works perfectly.

### Approach 2: Manual Balance Entry
Set your balance manually, system tracks usage and estimates remaining balance.

### Approach 3: Console Scraping (Advanced)
Automated browser scraping of Anthropic dashboard (requires additional setup).

---

## 🚀 Setup - Option 1: OpenRouter

If you use OpenRouter for Anthropic API access:

### 1. Set Environment Variables in Supabase

Go to: **Supabase Dashboard → Project Settings → Edge Functions → Secrets**

Add these secrets:
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `BREVO_API_KEY` - Your Brevo API key (already set for other notifications)
- `ALERT_EMAIL` - `pilowgems@gmail.com`

### 2. Deploy Edge Function

```bash
cd scholar-notifications
supabase functions deploy check-anthropic-balance
```

### 3. Run Database Migration

In **Supabase Dashboard → SQL Editor**, run:
```sql
-- Copy contents of supabase/migrations/002_anthropic_balance_monitor.sql
```

This creates:
- Daily cron job at 9 AM UTC (4 AM EST)
- Balance log table
- Manual trigger function

### 4. Test Manually

```bash
curl -X POST \
  https://rjlqmfthemfpetpcydog.supabase.co/functions/v1/check-anthropic-balance \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Or in Supabase SQL Editor:
```sql
SELECT check_anthropic_balance_cron();
```

---

## 🔧 Setup - Option 2: Direct Anthropic API

### Check if Anthropic Has Balance Endpoint

```bash
# Test if balance endpoint exists
curl https://api.anthropic.com/v1/organization/balance \
  -H "x-api-key: YOUR_ANTHROPIC_KEY" \
  -H "anthropic-version: 2023-06-01"
```

If this works:
1. Set `ANTHROPIC_API_KEY` in Supabase secrets
2. Deploy the function
3. It will work automatically

If it returns 404:
- Anthropic doesn't support this yet
- Use OpenRouter or manual tracking instead

---

## 📊 What Gets Checked

The monitor checks:
- ✅ Current account balance
- ✅ Compares against $5.00 threshold
- ✅ Sends email alert if below threshold
- ✅ Logs all checks to database

### Email Alert Includes:
- Current balance amount
- Alert threshold
- Timestamp of check
- Direct link to add funds
- Warning about service interruption

---

## 📅 Schedule

**Default**: Every day at 9:00 AM UTC (4:00 AM EST)

### Change Schedule:

```sql
-- Unschedule current job
SELECT cron.unschedule('check-anthropic-balance-daily');

-- Schedule new time (example: every 6 hours)
SELECT cron.schedule(
  'check-anthropic-balance-daily',
  '0 */6 * * *',
  $$SELECT check_anthropic_balance_cron()$$
);
```

### Cron Format Examples:
```
'0 9 * * *'    = 9 AM every day
'0 */6 * * *'  = Every 6 hours
'0 0 * * 1'    = Midnight every Monday
'0 12 * * 1-5' = Noon on weekdays
```

---

## 🧪 Testing

### Manual Test:
```sql
-- In Supabase SQL Editor
SELECT check_anthropic_balance_cron();
```

### Check Logs:
```sql
-- View balance check history
SELECT * FROM anthropic_balance_logs 
ORDER BY checked_at DESC 
LIMIT 10;

-- View cron job runs
SELECT * FROM cron.job_run_details 
WHERE jobname = 'check-anthropic-balance-daily'
ORDER BY start_time DESC 
LIMIT 10;
```

### View Scheduled Jobs:
```sql
SELECT * FROM cron.job;
```

---

## 🔍 Monitoring

### Check Function Logs:
```bash
supabase functions logs check-anthropic-balance --tail
```

### Check Email Delivery:
- Go to Brevo dashboard
- Check "Statistics" → "Real-time activity"
- Look for emails to pilowgems@gmail.com

### Database Logs:
```sql
-- Recent checks
SELECT 
  checked_at,
  balance,
  alert_sent,
  error
FROM anthropic_balance_logs
ORDER BY checked_at DESC
LIMIT 20;

-- Find alerts
SELECT * FROM anthropic_balance_logs
WHERE alert_sent = true
ORDER BY checked_at DESC;
```

---

## 🛠️ Troubleshooting

### No Emails Received?

1. **Check function logs**:
   ```bash
   supabase functions logs check-anthropic-balance
   ```

2. **Verify cron is running**:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobname = 'check-anthropic-balance-daily'
   ORDER BY start_time DESC;
   ```

3. **Test manually**:
   ```sql
   SELECT check_anthropic_balance_cron();
   ```

4. **Check Brevo dashboard** for bounced emails

### Balance Check Failing?

**Error: "Balance check not available"**
- Anthropic API doesn't have balance endpoint
- Switch to OpenRouter or manual tracking

**Error: "API key invalid"**
- Check `ANTHROPIC_API_KEY` or `OPENROUTER_API_KEY` in Supabase secrets
- Verify key has proper permissions

**Error: "net.http_post failed"**
- Check that `pg_net` extension is enabled
- Verify service role key is set in database config

---

## 🔄 Alternative: Manual Balance Tracking

If APIs don't work, track manually:

```sql
-- Log current balance manually
INSERT INTO anthropic_balance_logs (balance, currency)
VALUES (25.50, 'USD');

-- Create alert rule
CREATE OR REPLACE FUNCTION check_manual_balance()
RETURNS void AS $$
DECLARE
  latest_balance numeric;
BEGIN
  SELECT balance INTO latest_balance
  FROM anthropic_balance_logs
  ORDER BY checked_at DESC
  LIMIT 1;
  
  IF latest_balance < 5.00 THEN
    -- Send alert via edge function
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-balance-alert',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object('balance', latest_balance)
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule manual check
SELECT cron.schedule(
  'check-manual-balance',
  '0 9 * * *',
  $$SELECT check_manual_balance()$$
);
```

Update balance weekly via SQL:
```sql
INSERT INTO anthropic_balance_logs (balance) VALUES (12.50);
```

---

## 💡 Recommendations

1. **Use OpenRouter**: Most reliable for programmatic balance checks
2. **Set conservative threshold**: Alert at $10 instead of $5 for more buffer
3. **Check frequently**: Use 6-hour intervals during high usage periods
4. **Keep backup funds**: Have a credit card on file for auto-reload

---

## 📧 Email Template Preview

```
Subject: ⚠️ Anthropic API Balance Low: $3.45

Current Balance: $3.45 USD
Alert Threshold: $5.00

⚡ Action Required: Add funds to avoid service interruption

[Add Funds Button]

Checked: Thursday, February 13, 2026 at 9:00 AM
```

---

## 🔐 Security

- ✅ API keys stored as Supabase secrets
- ✅ Balance logs protected by RLS
- ✅ Only service role can access
- ✅ Email alerts sent via Brevo (HTTPS)

---

## 📊 Future Enhancements

- [ ] SMS alerts via Brevo (in addition to email)
- [ ] Telegram bot integration for instant alerts
- [ ] Usage rate tracking ($/day burn rate)
- [ ] Predictive alerts ("balance will run out in 3 days")
- [ ] Auto-reload integration with payment processor
- [ ] Slack/Discord webhook integration

---

**Status**: ✅ Ready to deploy  
**Deployment Time**: ~10 minutes  
**Maintenance**: Zero (fully automated)  

🚀 **Set it and forget it!**
