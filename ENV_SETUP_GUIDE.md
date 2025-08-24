# Environment Setup Guide

## Required Environment Variables

Your application requires the following environment variables to be set in `.env.local`:

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### NextAuth Configuration
```
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000
```

## How to Get These Values

### 1. Supabase Setup
1. Go to https://supabase.com and create a new project
2. In your Supabase dashboard, go to Settings > API
3. Copy the "URL" for `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the "service_role" key for `SUPABASE_SERVICE_ROLE_KEY`

### 2. NextAuth Secret
Generate a secure random string for `NEXTAUTH_SECRET`. You can use:
- Online UUID generator
- `openssl rand -base64 32` command
- Any secure random string generator

### 3. NEXTAUTH_URL
Set this to your development URL (usually `http://localhost:3000`)

## Example .env.local File

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb-service-role-key-here

# NextAuth
NEXTAUTH_SECRET=your-secure-random-secret-here
NEXTAUTH_URL=http://localhost:3000
```

## Verification

After setting up your environment variables, restart the development server and run:

```bash
node check-env.js
```

This should show all variables as "set" and the application should work properly.
