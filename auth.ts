import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"

/**
 * NextAuth.js configuration for Google OAuth authentication
 * 
 * This setup provides:
 * - Google OAuth login via Google Cloud Console credentials
 * - Automatic user creation and session management
 * - Prisma database adapter for storing user sessions
 * - Secure credential handling via environment variables
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Use Prisma adapter to store sessions and user data in PostgreSQL
  adapter: PrismaAdapter(prisma),
  
  // Configure authentication providers
  providers: [
    Google({
      // Google OAuth credentials from environment variables
      // These are set in .env.local and should never be committed to git
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      
      // Request additional profile information from Google
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  // Configure session and callback behavior
  callbacks: {
    /**
     * Called when JWT is created or updated
     * Add user ID to token for use in other callbacks
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },

    /**
     * Called whenever session is checked
     * Add user ID to session object for client-side access
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },

  // Configure pages for authentication flows
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  // Enable debug mode in development for troubleshooting
  debug: process.env.NODE_ENV === "development",
})
