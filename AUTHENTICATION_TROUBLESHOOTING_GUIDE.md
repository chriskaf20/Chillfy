# Authentication Configuration Error Troubleshooting Guide

## Problem
When pressing sign in, you get the error: 
- `http://localhost:3000/auth/error?error=Configuration`
- "There is a problem with the server configuration."
- `POST /api/auth/_log 500 in 22ms`

## Step-by-Step Solution

### 1. Check Environment Variables
Open your `.env.local` file and ensure ALL of these variables are set correctly:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# NextAuth Configuration
NEXTAUTH_SECRET=your-secure-random-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### 2. Verify Database Schema
Ensure your Supabase `users` table has these required columns:
```sql
-- Required columns
password_hash TEXT
email_verified TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP

-- Existing columns (should be present)
id UUID PRIMARY KEY
email TEXT UNIQUE
name TEXT
role TEXT DEFAULT 'attendee'
image TEXT
```

### 3. Test Environment Variables
Run this command to check if variables are set:
```bash
node check-env.js
```

### 4. Check Server Logs
Look at the terminal where your Next.js server is running for detailed error messages.

### 5. Manual API Testing
Test the authentication endpoint manually:
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 6. Common Issues to Check
- ✅ All environment variables are set in `.env.local`
- ✅ Database schema matches requirements
- ✅ Supabase project is active and accessible
- ✅ NEXTAUTH_SECRET is a secure random string
- ✅ NEXTAUTH_URL matches your development URL

### 7. Quick Fixes
If you're missing any environment variables, add them to `.env.local` and restart your development server.

### 8. Database Setup
If the `users` table is missing required columns, run these SQL commands in your Supabase SQL editor:

```sql
-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

## Verification
After making changes:
1. Restart your development server
2. Try signing in again
3. Check server logs for any remaining errors

## Need More Help?
If the issue persists after following these steps, check:
- Browser console for client-side errors
- Server terminal for backend errors
- Supabase dashboard for database connection issues
