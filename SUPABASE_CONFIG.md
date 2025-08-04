# 🔐 Supabase Configuration Update

## Replace Credentials in These Files:

### 1. Client Configuration
**File**: `client/lib/supabase.ts`
```typescript
const supabaseUrl = 'YOUR_PROJECT_URL_HERE'  // Replace this
const supabaseKey = 'YOUR_ANON_KEY_HERE'     // Replace this
```

### 2. Server Configuration  
**File**: `server/routes/submissions.ts`
```typescript
const supabaseUrl = 'YOUR_PROJECT_URL_HERE'  // Replace this
const supabaseKey = 'YOUR_ANON_KEY_HERE'     // Replace this
```

## Example:
```typescript
const supabaseUrl = 'https://abcdefghijk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk5NDc5OTgsImV4cCI6MjAwNTUyMzk5OH0.example-key-here'
```

## 🧪 Testing Your Setup

### Test 1: Database Connection
Run this in Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM public.submissions;
```

### Test 2: Insert Test Data
```sql
INSERT INTO public.submissions (team_id, level, password, difficulty_rating) 
VALUES ('999', 1, 'test-password', 5);
```

### Test 3: Real-time Check
```sql
-- Check if real-time is enabled
SELECT schemaname, tablename, hasrls 
FROM pg_tables 
WHERE tablename = 'submissions';
```

## 🚨 Important Settings

### Database Settings
- **Database Password**: Save this securely
- **JWT Secret**: Auto-generated, don't change
- **Service Role Key**: Keep private (not used in this app)

### API Settings
- **URL**: `https://[your-project-id].supabase.co`
- **Anon Key**: Safe to use in frontend
- **RLS**: Must be enabled for security

### Real-time Settings
- **Enable real-time**: ✅ ON
- **Table**: `submissions`
- **Events**: INSERT, UPDATE, DELETE

## 🔍 Troubleshooting

### Common Issues:

1. **"relation 'submissions' does not exist"**
   - Run the SQL setup script again
   - Check you're in the right project

2. **"RLS policy violation"**  
   - Ensure RLS policies are created
   - Check anon role has permissions

3. **Real-time not working**
   - Enable real-time in Database > Replication
   - Check publication includes submissions table

4. **CORS errors**
   - Add your domain to allowed origins in Authentication > Settings

### Verification Commands:
```sql
-- Check table exists
\dt public.submissions

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'submissions';

-- Check permissions
SELECT * FROM information_schema.table_privileges 
WHERE table_name = 'submissions';
```
