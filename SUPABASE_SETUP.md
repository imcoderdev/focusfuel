# Supabase Migration Setup Guide

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - Name: `focus-app` (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose closest to your users
6. Wait for the project to be created (2-3 minutes)

## 2. Get Supabase Credentials

From your Supabase dashboard:

1. Go to Settings → API
2. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

3. Go to Settings → Database
4. Copy the **Connection string** → `DATABASE_URL`
   - Make sure to replace `[YOUR-PASSWORD]` with your actual database password
   - Add `?pgbouncer=true&connection_limit=1` at the end for better performance

## 3. Update Environment Variables

Create a `.env.local` file in your project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database URL for Prisma
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/[database]?pgbouncer=true&connection_limit=1
```

## 4. Set up Authentication in Supabase

1. In Supabase Dashboard, go to Authentication → Settings
2. Configure Site URL: `http://localhost:3000` (for development)
3. Add Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - Add your production URL when deploying

## 5. Run Database Migrations

```bash
# Install dependencies
npm install

# Reset and create new migration
npx prisma migrate dev --name supabase_init

# Generate Prisma client
npx prisma generate
```

## 6. Enable Row Level Security (Optional but Recommended)

In Supabase SQL Editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Mood" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FocusSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reflection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmergencyLog" ENABLE ROW LEVEL SECURITY;

-- Create policies for User table
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (auth.uid()::text = id);

-- Create policies for Task table
CREATE POLICY "Users can view own tasks" ON "Task"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own tasks" ON "Task"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own tasks" ON "Task"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own tasks" ON "Task"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Create similar policies for other tables
CREATE POLICY "Users can manage own moods" ON "Mood"
  FOR ALL USING (auth.uid()::text = "userId");

CREATE POLICY "Users can manage own focus sessions" ON "FocusSession"
  FOR ALL USING (auth.uid()::text = "userId");

CREATE POLICY "Users can manage own reflections" ON "Reflection"
  FOR ALL USING (auth.uid()::text = "userId");

CREATE POLICY "Users can manage own emergency logs" ON "EmergencyLog"
  FOR ALL USING (auth.uid()::text = "userId");
```

## 7. Test the Setup

```bash
# Start the development server
npm run dev
```

Visit `http://localhost:3000` and test:
1. Registration (you'll receive an email verification)
2. Email verification
3. Login
4. Access to dashboard

## 8. What Changed

### ✅ Migrated to Supabase:
- Replaced `@neondatabase/serverless` with `@supabase/supabase-js`
- Removed NextAuth.js dependencies
- Updated User model to use UUIDs (Supabase standard)
- Added Supabase authentication helpers
- Updated login/register pages
- Added AuthProvider for client-side auth state

### 🔄 What Stays the Same:
- Prisma ORM for database operations
- All existing feature functionality
- Database models and relationships
- API route structure (just update auth checks)

### 🚀 New Capabilities:
- Real-time subscriptions
- Built-in email verification
- Social auth providers (Google, GitHub, etc.)
- Advanced security with Row Level Security
- Better performance with edge functions
- Built-in file storage

## 9. Next Steps

1. Update remaining API routes to use Supabase auth
2. Add real-time features (optional)
3. Implement file upload for user avatars
4. Add social authentication providers
5. Deploy to production with proper environment variables

## Troubleshooting

- **Database connection issues**: Double-check your DATABASE_URL format
- **Auth not working**: Verify your Supabase project URL and keys
- **CORS issues**: Make sure your site URL is configured in Supabase
- **Email verification not working**: Check spam folder and Supabase email settings
