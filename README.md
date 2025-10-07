# Chillfy (Next.js)

A Next.js, TypeScript, shadcn-ui, and Tailwind CSS app for event discovery in North Cyprus.

## Getting Started

1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   cd chillfy
   ```

2. **Add your credentials to `.env.local`**

3. **Install dependencies**
   ```sh
   npm install
   ```

4. **Run the development server**
   ```sh
   npm run dev
   ```

5. **Open your browser**
   Go to [http://localhost:3000](http://localhost:3000)

## Integrations

- Supabase (events table)
- Google Analytics
- Google Social Login (NextAuth.js)
- Email API (Resend)
- Extra pages: FAQ, Partners, Profile, Privacy, Terms, Dashboard

---

## Admin roles setup (Supabase)

This project authorizes admins using a server-controlled `profiles` table (preferred over trusting `user_metadata`).

1) Open Supabase SQL editor and run `supabase/profiles.sql` to create `public.profiles`, RLS policies, and signup trigger.
2) Mark a user as admin manually through the Supabase dashboard:
   - Go to Authentication > Users in your Supabase dashboard
   - Select the user you want to make an admin
   - Edit their user metadata to include `role: "admin"` OR
   - Update the profiles table directly to set `is_admin = true`

⚠️ **Important**: Admin users can ONLY be created manually through the Supabase dashboard. There are no API endpoints or UI pages that allow creating admin users for security reasons.

The API checks `profiles.is_admin = true` or `profiles.role = 'admin'` first, then falls back to `user_metadata.role` only if needed.