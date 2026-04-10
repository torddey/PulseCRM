import { handlers } from "@/auth"

/**
 * NextAuth.js API route handler
 * 
 * This route handles all authentication flows:
 * - GET /api/auth/signin - Sign in page
 * - POST /api/auth/signin - Process sign in
 * - GET /api/auth/callback/google - Google OAuth callback
 * - GET /api/auth/session - Get current session
 * - POST /api/auth/signout - Sign out
 * 
 * All requests are automatically routed to the appropriate handler
 * based on the [...nextauth] catch-all route pattern
 */

// Export NextAuth.js handlers for GET and POST requests
export const { GET, POST } = handlers
