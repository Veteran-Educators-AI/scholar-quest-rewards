# ⚡ Quick Start Guide

Fast setup for Scholar Quest notification system + Anthropic balance monitor.

## 🚀 5-Minute Setup

### 1. Set Secrets in Supabase (2 min)

Go to: **Supabase Dashboard → Project Settings → Edge Functions → Secrets**

Add these three secrets:

| Secret Name | Value | Where to Get It |
|------------|-------|----------------|
| `BREVO_API_KEY` | Your Brevo API key | Brevo Dashboard → Account → SMTP & API |
| `ANTHROPIC_API_KEY` | Your Anthropic key | Anthropic Console → Settings → API Keys |
| `ALERT_EMAIL` | `pilowgems@gmail.com` | (your email) |

Click "Save" after each one.

### 2. Deploy Edge Functions (2 min)

```bash
cd scholar-notifications

# Login (if not already)
supabase login

# Link project
supabase link --project-ref rjlqmfthemfpetpcydog

# Deploy all three functions at once
supabase functions deploy notify-teacher-completion
supabase functions deploy notify-student-new-assignment
supabase functions deploy check-anthropic-balance
```

### 3. Enable pg_net Extension (30 sec)

**Supabase Dashboard → Database → Extensions**
- Search: `pg_net`
- Click: "Enable"

### 4. Run SQL Migrations (1 min)

**Supabase Dashboard → SQL Editor → New Query**

Paste and run **BOTH** of these (in order):

1. First: `supabase/migrations/001_email_notifications.sql`
2. Second: `supabase/migrations/002_anthropic_balance_monitor.sql`

Click "Run" for each.

---

## ✅ You're Done!

### What Happens Now:

**Immediately:**
- ✅ Teachers get emails when students complete assignments
- ✅ Students get emails when new assignments posted

**Tomorrow at 9 AM UTC (4 AM EST):**
- ✅ Your Anthropic balance will be checked
- ✅ If under $5, you'll get an email alert

---

## 🧪 Test It Now

### Test Balance Monitor:
```bash
curl -X POST \
  https://rjlqmfthemfpetpcydog.supabase.co/functions/v1/check-anthropic-balance \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Or in SQL Editor:
```sql
SELECT check_anthropic_balance_cron();
```

### Test Teacher Notification:
- Have a student complete an assignment
- Check teacher's email

### Test Student Notification:
- Post a new assignment as teacher
- Check student emails

---

## 📊 Monitor It

### View Function Logs:
```bash
supabase functions logs check-anthropic-balance --tail
supabase functions logs notify-teacher-completion --tail
supabase functions logs notify-student-new-assignment --tail
```

### Check Balance History:
```sql
SELECT * FROM anthropic_balance_logs ORDER BY checked_at DESC LIMIT 10;
```

### View Notifications:
```sql
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20;
```

---

## ⚙️ Customize

### Change Balance Alert Threshold:

Edit `check-anthropic-balance/index.ts`:
```typescript
const BALANCE_THRESHOLD = 10.00 // Change from 5.00 to 10.00
```

Redeploy:
```bash
supabase functions deploy check-anthropic-balance
```

### Change Check Schedule:

```sql
-- Change from daily to every 6 hours
SELECT cron.unschedule('check-anthropic-balance-daily');
SELECT cron.schedule(
  'check-anthropic-balance-daily',
  '0 */6 * * *',
  $$SELECT check_anthropic_balance_cron()$$
);
```

### Change Alert Email:

Update in Supabase secrets:
- Go to Edge Functions → Secrets
- Edit `ALERT_EMAIL`
- Change to new email

---

## 🐛 Troubleshooting

### No emails?
1. Check spam folder
2. Verify Brevo API key
3. Check function logs
4. Verify email addresses exist in database

### Balance check failing?
- Anthropic might not have balance API yet
- Try OpenRouter instead
- Or use manual tracking (see docs)

### Cron not running?
```sql
-- Check if pg_cron is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- View scheduled jobs
SELECT * FROM cron.job;

-- View run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## 📚 Full Documentation

- **README.md** - Complete system overview
- **ANTHROPIC_BALANCE_MONITOR.md** - Detailed balance monitor guide
- **DEPLOYMENT_CHECKLIST.md** - Step-by-step deployment
- **SUMMARY.md** - Technical architecture

---

**Total Setup Time**: ~5 minutes  
**Maintenance Required**: Zero (fully automated)  
**Cost**: $0 (uses free tiers)  

🎉 **You're all set!**
