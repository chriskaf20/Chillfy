// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client with ANON key for authentication
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Create Supabase client with service role key for profile queries
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Extend the User type to include role
interface ExtendedUser extends User {
  role?: string;
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Use Supabase's built-in authentication
          const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (authError || !authData.user) {
            console.error("Authentication failed:", authError);
            return null;
          }

          // Fetch user profile from profiles table
          const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id, name, role")
            .eq("id", authData.user.id)
            .single();

          if (profileError) {
            console.error("Profile fetch error:", profileError);
            // Still return user data even if profile fetch fails
            return {
              id: authData.user.id,
              email: authData.user.email!,
              name: authData.user.user_metadata?.name || '',
              role: 'attendee', // default role
            } as ExtendedUser;
          }

          // Return combined user data
          return {
            id: authData.user.id,
            email: authData.user.email!,
            name: profile.name || authData.user.user_metadata?.name || '',
            role: profile.role || 'attendee',
          } as ExtendedUser;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).role = (user as ExtendedUser).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = (token as any).role;
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode for troubleshooting
});

export { handler as GET, handler as POST };
