# Authentication System Setup Guide

This guide explains how to set up and use the new email/password authentication system alongside the existing magic link authentication.

## 🚀 New Features Added

### 1. Email/Password Sign-Up
- New sign-up page at `/auth/signup`
- Password validation: 8+ characters, uppercase, lowercase, and number
- Password confirmation field
- Automatic sign-in after successful registration

### 2. Password-Based Sign-In
- Updated sign-in page with toggle between magic links and password
- Password visibility toggle
- Error handling for invalid credentials

### 3. Enhanced Navigation
- Sign-up button added to NavBar for unauthenticated users
- Mobile-responsive navigation updates

## 🔧 Required Environment Variables

Copy the following variables from `.env.example` to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Email Configuration (for magic links)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password
EMAIL_FROM=noreply@chillfy.com
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
2. Toggle to "Password" method
3. Enter email and password
4. Click "Sign In"
5. User will be redirected to dashboard

### Magic Link Authentication (Existing)
- Still available via the "Magic Link" toggle
- Works exactly as before

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
5. **Magic Link**: Verify magic link authentication still works

## 📝 Notes

- The system maintains backward compatibility with existing magic link users
- Users created via magic links can later set a password through profile settings
- Password reset functionality can be added as a future enhancement
- Consider adding rate limiting for production deployment

## 🚨 Troubleshooting

**Common Issues:**
1. **Environment variables not set**: Check all required variables are in `.env.local`
2. **Database schema mismatch**: Verify all required columns exist in `users` table
3. **Email configuration**: Magic links require proper email server setup
4. **CORS issues**: Ensure `NEXTAUTH_URL` is set correctly

For additional help, check the browser console and server logs for error messages.
