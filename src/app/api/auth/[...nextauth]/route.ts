// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { User } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Extend the User type to include role
interface ExtendedUser extends User {
  role?: string;
}

const handler = NextAuth({
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "noreply@chillfy.com",
      maxAge: 24 * 60 * 60, // 24 hours
    }),
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
          // Check if user exists and verify password through our API
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/signin`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (response.ok) {
            const user = await response.json();
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.image
            };
          }
          
          return null;
        } catch (error) {
          console.error("Credentials auth error:", error);
          return null;
        }
      }
    })
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        // Fetch user role from database
        const { data: userData } = await supabase
          .from("users")
          .select("id, role")
          .eq("email", session.user.email)
          .single();

        (session.user as any).id = userData?.id || (user as ExtendedUser).id;
        (session.user as any).role = userData?.role || "attendee";
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        (token as any).role = (user as ExtendedUser).role || "attendee";
      }
      return token;
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Handle email provider sign-in (magic links)
      if (account?.provider === "email") {
        if (user.email) {
          const { data: existingUser } = await supabase
            .from("users")
            .select("role")
            .eq("email", user.email)
            .single();

          if (!existingUser) {
            // Set default role for new users from magic links
            await supabase
              .from("users")
              .insert({
                email: user.email,
                name: user.name,
                image: user.image,
                role: "attendee",
                email_verified: new Date(),
              });
          }
        }
        return true;
      }

      // Handle credentials provider sign-in (email/password)
      if (account?.provider === "credentials") {
        return true; // Already authenticated in authorize function
      }

      return false;
    },
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
