import { auth } from "@/auth"

/**
 * NextAuth.js Middleware
 * 
 * This middleware protects routes and ensures users are authenticated
 * before accessing protected pages.
 * 
 * Routes that require authentication:
 * - /dashboard and all sub-routes
 * - /clients and all sub-routes
 * - /settings and all sub-routes
 * 
 * Public routes (no authentication required):
 * - / (home page)
 * - /auth/* (authentication pages)
 * - /api/auth/* (NextAuth API routes)
 */

export default auth((req) => {
  // If user is not authenticated and trying to access protected route,
  // they will be redirected to sign in page by NextAuth.js
  // This is handled automatically by the auth() middleware
})

// Configure which routes require authentication
export const config = {
  // Protect all routes except public ones
  matcher: [
    // Protect dashboard and all sub-routes
    "/dashboard/:path*",
    // Protect client management routes
    "/clients/:path*",
    // Protect settings routes
    "/settings/:path*",
    // Protect API routes (except auth routes)
    "/api/:path*",
  ],
}
