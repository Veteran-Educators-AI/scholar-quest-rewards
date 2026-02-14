# 📋 Deployment Checklist

Use this checklist to deploy the email notification system to Scholar Quest.

## Pre-Deployment

- [ ] Brevo account is active and verified
- [ ] Brevo API key is ready (found in Brevo Dashboard → Account → SMTP & API)
- [ ] Supabase CLI installed: `npm install -g supabase`
- [ ] You have admin access to Supabase project

## Step-by-Step Deployment

### 1. Configure Brevo API Key
- [ ] Go to: Supabase Dashboard → Project Settings → Edge Functions → Secrets
- [ ] Click "Add secret"
- [ ] Name: `BREVO_API_KEY`
- [ ] Value: Paste your Brevo API key
- [ ] Click "Save"

### 2. Deploy Edge Functions
```bash
cd scholar-notifications

# Login to Supabase
supabase login

# Link project
supabase link --project-ref rjlqmfthemfpetpcydog

# Deploy functions
supabase functions deploy notify-teacher-completion
supabase functions deploy notify-student-new-assignment
```

- [ ] First function deployed successfully
- [ ] Second function deployed successfully
- [ ] No errors in deployment logs

### 3. Enable pg_net Extension
- [ ] Go to: Supabase Dashboard → Database → Extensions
- [ ] Search for "pg_net"
- [ ] Click "Enable" button
- [ ] Refresh page to confirm enabled

### 4. Run Database Migration
- [ ] Go to: Supabase Dashboard → SQL Editor
- [ ] Click "New query"
- [ ] Copy contents of `supabase/migrations/001_email_notifications.sql`
- [ ] Paste into SQL editor
- [ ] Click "Run"
- [ ] Verify "Success. No rows returned" message

### 5. Set Database Configuration
- [ ] Go to: Supabase Dashboard → Database Settings
- [ ] Scroll to "Custom Postgres Configuration"
- [ ] Click "Add configuration"
- [ ] Add:
  ```
  app.supabase_url = https://rjlqmfthemfpetpcydog.supabase.co
  ```
- [ ] Click "Add configuration" again
- [ ] Get service role key from: Project Settings → API → service_role (secret!)
- [ ] Add:
  ```
  app.supabase_service_role_key = <paste key here>
  ```
- [ ] Click "Save"
- [ ] Restart database if prompted

### 6. Verify Deployment

Run verification checks:

```bash
# Check if functions are deployed
curl https://rjlqmfthemfpetpcydog.supabase.co/functions/v1/notify-teacher-completion \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

- [ ] Function responds (not 404)
- [ ] Check function logs: `supabase functions logs notify-teacher-completion`

### 7. Test Email Flow

#### Test Teacher Notification:
- [ ] Have a student complete an assignment in Scholar Quest
- [ ] Check teacher's email inbox (including spam)
- [ ] Verify email received with correct details
- [ ] Click link in email - should go to Teacher AI

#### Test Student Notification:
- [ ] Post a new assignment as teacher
- [ ] Check student email inbox
- [ ] Verify email received with assignment details
- [ ] Click link in email - should go to Scholar Quest

### 8. Monitor First 24 Hours
- [ ] Check Supabase function logs for errors
- [ ] Check Brevo dashboard for send statistics
- [ ] Verify notifications table has new entries:
  ```sql
  SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
  ```
- [ ] Ask users if they received emails

## Rollback Plan (If Something Goes Wrong)

### Disable Triggers Without Deleting:
```sql
-- Disable teacher notification trigger
ALTER TABLE student_progress DISABLE TRIGGER trigger_notify_teacher_completion;

-- Disable student notification trigger  
ALTER TABLE assignments DISABLE TRIGGER trigger_notify_students_new_assignment;
```

### Re-enable Later:
```sql
ALTER TABLE student_progress ENABLE TRIGGER trigger_notify_teacher_completion;
ALTER TABLE assignments ENABLE TRIGGER trigger_notify_students_new_assignment;
```

### Complete Removal (if needed):
```sql
DROP TRIGGER IF EXISTS trigger_notify_teacher_completion ON student_progress;
DROP TRIGGER IF EXISTS trigger_notify_students_new_assignment ON assignments;
DROP FUNCTION IF EXISTS notify_teacher_on_completion();
DROP FUNCTION IF EXISTS notify_students_new_assignment();
```

## Post-Deployment

- [ ] Update team that email notifications are live
- [ ] Document any issues encountered
- [ ] Schedule follow-up check in 1 week
- [ ] Consider adding more notification types (due date reminders, etc.)

## Notes

Write any issues or observations here:

---

**Deployed by**: _______________  
**Date**: _______________  
**Time**: _______________  
**Status**: [ ] Success  [ ] Partial  [ ] Failed

