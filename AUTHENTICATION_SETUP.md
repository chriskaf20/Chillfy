# Authentication System Setup Guide

This guide explains how to set up and use the email/password authentication system.

## 🚀 Features

### 1. Email/Password Sign-Up
- New sign-up page at `/auth/signup`
- Password validation: 8+ characters, uppercase, lowercase, and number
- Password confirmation field
- Automatic sign-in after successful registration

### 2. Password-Based Sign-In
- Sign-in page with email and password authentication
- Password visibility toggle
- Error handling for invalid credentials

### 3. Enhanced Navigation
- Sign-up button added to NavBar for unauthenticated users
- Mobile-responsive navigation updates

## 🔧 Required Environment Variables

Copy the following variables from `.env.example` to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cqielphvhaprrwbzlrvx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxaWVscGh2aGFwcnJ3YnpscnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNzA0OTQsImV4cCI6MjA2Mzk0NjQ5NH0.p95sA0TxgQFptkukc89J3pOuAjwHmyBiKst8aSoBs1M
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxaWVscGh2aGFwcnJ3YnpscnZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM3MDQ5NCwiZXhwIjoyMDYzOTQ2NDk0fQ.n4nWrWZw3lzRPDMuHEhM_BDCmw9f24E8yqz6Dqski7k


# NextAuth Configuration
NEXTAUTH_SECRET=nrgYPz7KPeVq0u0QmG57vsQn94qryleQfHYzUm+h1Zo=
NEXTAUTH_URL=http://localhost:3000
```

## 📋 Database Schema Requirements

The authentication system expects the following columns in your `users` table:

```sql
-- Required columns for password authentication
password_hash TEXT -- For storing hashed passwords
email_verified TIMESTAMP -- For tracking email verification status
created_at TIMESTAMP -- Account creation timestamp
updated_at TIMESTAMP -- Last update timestamp

-- Existing columns (should already be present)
id UUID PRIMARY KEY
email TEXT UNIQUE
name TEXT
role TEXT DEFAULT 'attendee'
image TEXT
```

## 🎯 Usage Instructions

### For New Users (Sign Up)
1. Click "Sign Up" in the navigation
2. Fill in email, password, and confirm password
3. Password must meet requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
4. Click "Create Account"
5. User will be automatically signed in and redirected to dashboard

### For Existing Users (Sign In)
1. Click "Sign In" in the navigation
2. Enter email and password
3. Click "Sign In"
4. User will be redirected to dashboard

## 🔄 API Endpoints

### POST `/api/auth/signup`
Creates a new user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
- `201 Created`: User created successfully
- `400 Bad Request`: Missing email or password
- `409 Conflict`: User already exists
- `500 Internal Server Error`: Server error

### POST `/api/auth/signin`
Authenticates user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
- `200 OK`: Authentication successful, returns user data
- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Server error

## 🛠️ Technical Implementation

### Password Hashing
- Uses `bcryptjs` with 12 rounds of salting
- Passwords are never stored in plain text
- Hash comparison for authentication

### Security Features
- Password strength validation
- CSRF protection via NextAuth
- Session management with secure cookies
- Rate limiting recommended for production

### Error Handling
- Comprehensive error messages for user feedback
- Console logging for debugging
- Proper HTTP status codes

## 🧪 Testing

1. **Sign Up Test**: Create a new account with valid credentials
2. **Password Validation**: Test with invalid passwords (too short, no uppercase, etc.)
3. **Sign In Test**: Login with the created account
4. **Existing User**: Try to create account with existing email

## 📝 Notes

- Password reset functionality can be added as a future enhancement
- Consider adding rate limiting for production deployment

## 🚨 Troubleshooting

**Common Issues:**
1. **Environment variables not set**: Check all required variables are in `.env.local`
2. **Database schema mismatch**: Verify all required columns exist in `users` table
3. **CORS issues**: Ensure `NEXTAUTH_URL` is set correctly

For additional help, check the browser console and server logs for error messages.
