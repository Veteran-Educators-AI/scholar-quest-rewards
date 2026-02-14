# 📧 Scholar Quest Email Notification System

Complete Brevo email integration for Scholar Quest - sends automated emails to teachers and students.

## ✨ Features

### 1. Teacher Notifications
- ✅ Email sent when student completes an assignment
- ✅ Includes student name, assignment title, completion time
- ✅ Direct link to view results in Teacher AI
- ✅ Logged in `notifications` table

### 2. Student Notifications
- ✅ Email sent when teacher posts new assignment
- ✅ Includes assignment details, due date, XP rewards
- ✅ Direct link to start assignment in Scholar Quest
- ✅ Batch email to all students in class

### 3. Anthropic API Balance Monitor 💰 (NEW!)
- ✅ Daily automated check of Anthropic API balance
- ✅ Email alert when balance drops below $5.00
- ✅ Prevents unexpected service interruptions
- ✅ Logs all balance checks for tracking
- 📖 See [ANTHROPIC_BALANCE_MONITOR.md](ANTHROPIC_BALANCE_MONITOR.md) for setup

## 📦 What's Included

```
scholar-notifications/
├── supabase/
│   ├── functions/
│   │   ├── notify-teacher-completion/
│   │   │   └── index.ts
│   │   ├── notify-student-new-assignment/
│   │   │   └── index.ts
│   │   └── check-anthropic-balance/        ⭐ NEW
│   │       └── index.ts
│   └── migrations/
│       ├── 001_email_notifications.sql
│       └── 002_anthropic_balance_monitor.sql ⭐ NEW
├── README.md
├── ANTHROPIC_BALANCE_MONITOR.md             ⭐ NEW
├── DEPLOYMENT_CHECKLIST.md
└── SUMMARY.md
```

## 🚀 Deployment Instructions

### Prerequisites
- Supabase project for Scholar Quest (already exists)
- Brevo account with API key
- Supabase CLI installed (`npm install -g supabase`)

### Step 1: Set Brevo API Key

1. Go to: **Supabase Dashboard** → Project Settings → Edge Functions → Secrets
2. Add new secret:
   - Name: `BREVO_API_KEY`
   - Value: Your Brevo API key (from Brevo dashboard)

### Step 2: Deploy Edge Functions

```bash
# Login to Supabase (if not already)
supabase login

# Link to your project
supabase link --project-ref rjlqmfthemfpetpcydog

# Deploy both edge functions
supabase functions deploy notify-teacher-completion
supabase functions deploy notify-student-new-assignment
```

### Step 3: Run Database Migration

Option A - Via Supabase Dashboard (Recommended):
1. Go to: **SQL Editor** in Supabase Dashboard
2. Copy contents of `supabase/migrations/001_email_notifications.sql`
3. Paste and run the SQL
4. Verify no errors

Option B - Via Supabase CLI:
```bash
supabase db push
```

### Step 4: Set Database Configuration

In Supabase Dashboard → **Database** → **Custom Postgres Configuration**, add:

```
app.supabase_url = https://rjlqmfthemfpetpcydog.supabase.co
app.supabase_service_role_key = <YOUR_SERVICE_ROLE_KEY>
```

⚠️ **IMPORTANT**: Get service role key from Project Settings → API → service_role

### Step 5: Enable pg_net Extension

In Supabase Dashboard → **Database** → **Extensions**:
- Search for `pg_net`
- Click "Enable"

This allows database triggers to call edge functions.

## 🧪 Testing

### Test Teacher Notification
```bash
curl -X POST \
  https://rjlqmfthemfpetpcydog.supabase.co/functions/v1/notify-teacher-completion \
  -H "Authorization: Bearer <YOUR_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test-student-id",
    "assignment_id": "test-assignment-id",
    "completed_at": "2024-02-13T23:00:00Z"
  }'
```

### Test Student Notification
```bash
curl -X POST \
  https://rjlqmfthemfpetpcydog.supabase.co/functions/v1/notify-student-new-assignment \
  -H "Authorization: Bearer <YOUR_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "assignment_id": "test-assignment-id",
    "class_id": "test-class-id",
    "teacher_id": "test-teacher-id"
  }'
```

## 🔍 Monitoring

### Check Edge Function Logs
```bash
supabase functions logs notify-teacher-completion
supabase functions logs notify-student-new-assignment
```

### Check Database Logs
In Supabase Dashboard → **Logs** → select log type

### Check Notifications Table
```sql
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
```

## 🐛 Troubleshooting

### Emails Not Sending?

1. **Check Brevo API Key**
   ```bash
   # View function secrets
   supabase functions list
   ```

2. **Check Function Logs**
   ```bash
   supabase functions logs notify-teacher-completion --tail
   ```

3. **Verify Trigger Fired**
   ```sql
   -- Check if trigger exists
   SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%';
   ```

4. **Check Brevo Dashboard**
   - Go to Brevo → Statistics → Real-time activity
   - Verify emails were sent

### Common Issues

| Issue | Solution |
|-------|----------|
| "pg_net extension not found" | Enable pg_net in Database → Extensions |
| "Service role key missing" | Add to Database → Custom Postgres Config |
| "Function returns 404" | Redeploy edge functions |
| "No emails received" | Check spam folder, verify Brevo API key |

## 📊 Expected Behavior

### When Student Completes Assignment:
1. `student_progress.completed_at` is set
2. Database trigger fires
3. Edge function `notify-teacher-completion` called
4. Email sent to teacher via Brevo
5. Record added to `notifications` table

### When Teacher Posts New Assignment:
1. New row inserted into `assignments` table
2. Database trigger fires
3. Edge function `notify-student-new-assignment` called
4. Batch email sent to all students in class via Brevo
5. Records added to `notifications` table for each student

## 🔒 Security Notes

- Edge functions use **Service Role Key** (full database access)
- Brevo API key stored as **secret** (not in code)
- Email addresses validated before sending
- Rate limiting handled by Brevo (check your plan limits)

## 📝 Database Schema Requirements

### Expected Tables:
- `profiles` - user info (email, full_name)
- `assignments` - assignment details
- `classes` - class info with teacher_id
- `student_classes` - enrollment (many-to-many)
- `student_progress` - tracks completion with completed_at
- `notifications` - logs all notifications

### If Tables Don't Match:
Edit trigger SQL in `001_email_notifications.sql` to match your schema.

## 🎯 Next Steps After Deployment

1. **Test with real data**: Have a student complete an assignment
2. **Check teacher's email**: Verify notification received
3. **Post a new assignment**: Verify students get emails
4. **Monitor Brevo usage**: Track email send limits
5. **Customize templates**: Edit HTML in edge functions if needed

## 💡 Customization

### Change Email Templates
Edit `index.ts` files in edge function folders - look for `htmlContent` sections.

### Add More Notification Types
Copy edge function structure and add new triggers for:
- Assignment due reminders
- Grade posted notifications
- Class announcements
- etc.

## 📧 Support

For issues:
1. Check Supabase function logs
2. Check Brevo API logs
3. Review this README
4. Contact: pilowgems@gmail.com

---

**Version**: 1.0.0  
**Last Updated**: February 13, 2026  
**Status**: Ready for deployment 🚀
