// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

        session.user.id = userData?.id || user.id;
        session.user.role = userData?.role || "attendee";
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role || "attendee";
      }
      return token;
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Ensure user has a role when signing in
      if (user.email) {
        const { data: existingUser } = await supabase
          .from("users")
          .select("role")
          .eq("email", user.email)
          .single();

        if (!existingUser) {
          // Set default role for new users
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
    },
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };