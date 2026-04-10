# Google OAuth Authentication Setup Guide

## Overview

This guide explains how to set up and use Google OAuth authentication in the Proactive AI Relationship Manager CRM using NextAuth.js.

## What's Included

✅ **Complete Google OAuth Integration**
- NextAuth.js v5 (latest version)
- Google OAuth provider configuration
- User session management
- Protected routes with middleware
- Sign-in and error pages
- User menu component with profile display
- Custom authentication hook (useAuth)

## Architecture

### Authentication Flow

```
User visits app
    ↓
Not authenticated → Redirected to /auth/signin
    ↓
User clicks "Sign in with Google"
    ↓
Redirected to Google login
    ↓
User authenticates with Google
    ↓
Google redirects back to app with auth code
    ↓
NextAuth.js exchanges code for user data
    ↓
User created/updated in database
    ↓
Session created and stored
    ↓
User redirected to /dashboard
    ↓
Authenticated user can access protected routes
```

### Key Components

**1. Authentication Configuration** (`auth.ts`)
- NextAuth.js setup with Google provider
- Prisma adapter for database storage
- JWT and session callbacks
- Error handling

**2. API Route** (`app/api/auth/[...nextauth]/route.ts`)
- Handles all authentication flows
- GET/POST requests for sign-in, callbacks, sessions
- Automatic routing based on request path

**3. Middleware** (`middleware.ts`)
- Protects routes that require authentication
- Redirects unauthenticated users to sign-in
- Configurable protected route patterns

**4. UI Components**
- **Sign-in page** (`app/auth/signin/page.tsx`) - Google OAuth button
- **Error page** (`app/auth/error/page.tsx`) - Authentication error handling
- **User menu** (`components/user-menu.tsx`) - Profile display and sign-out
- **Session provider** (`components/providers.tsx`) - Wraps app with NextAuth context

**5. Custom Hook** (`hooks/use-auth.ts`)
- Easy access to session data
- Sign-out functionality
- Authentication status checking

**6. Layout Integration** (`app/layout.tsx`)
- SessionProvider wraps entire app
- Enables useSession() hook throughout app

## Setup Instructions

### Step 1: Environment Variables

Your `.env.local` file contains the Google OAuth credentials:

```bash
# Google OAuth credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"

# NextAuth secret (CHANGE THIS IN PRODUCTION)
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"

# Application URLs
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**⚠️ IMPORTANT**: 
- `NEXTAUTH_SECRET` should be a long, random string in production
- Generate one: `openssl rand -base64 32`
- Never commit `.env.local` to git (already in .gitignore)
- Keep Google OAuth credentials secure and never share them

### Step 2: Database Setup

The authentication tables are defined in Prisma schema. Run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Create authentication tables in database
npx prisma migrate dev --name add_auth_tables

# Or run SQL migration directly
psql -h localhost -U $PGUSER -d crm_db -f prisma/migrations/add_auth_tables.sql
```

### Step 3: Start the Application

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# App will be available at http://localhost:3000
```

### Step 4: Test Authentication

1. **Visit the app**: Open `http://localhost:3000`
2. **You should be redirected** to `/auth/signin` (not authenticated)
3. **Click "Sign in with Google"** button
4. **Authenticate with Google** using your Google account
5. **You'll be redirected** to `/dashboard` after successful authentication
6. **Your profile** will display in the top-right user menu

## File Structure

```
app/
  api/
    auth/
      [...nextauth]/
        route.ts              # NextAuth API route handler
  auth/
    signin/
      page.tsx               # Sign-in page with Google button
    error/
      page.tsx               # Authentication error page
  layout.tsx                 # Root layout with SessionProvider
  page.tsx                   # Home page (public)
  dashboard/
    page.tsx                 # Protected dashboard page

components/
  providers.tsx              # SessionProvider wrapper
  user-menu.tsx              # User profile menu component
  ui/                        # shadcn/ui components

hooks/
  use-auth.ts                # Custom authentication hook

lib/
  db.ts                      # Prisma client

auth.ts                       # NextAuth.js configuration
middleware.ts                 # Route protection middleware
.env.local                    # Environment variables (not in git)
```

## Usage Examples

### Using Authentication in Components

**Client Component** (with useSession hook):

```typescript
"use client"

import { useSession } from "next-auth/react"

export function MyComponent() {
  const { data: session, status } = useSession()

  if (status === "loading") return <div>Loading...</div>
  if (status === "unauthenticated") return <div>Not signed in</div>

  return <div>Welcome, {session?.user?.name}</div>
}
```

**Using Custom Hook** (recommended):

```typescript
"use client"

import { useAuth } from "@/hooks/use-auth"

export function MyComponent() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Not signed in</div>

  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

**Server Component** (with auth function):

```typescript
import { auth } from "@/auth"

export default async function ProtectedPage() {
  const session = await auth()

  if (!session) {
    return <div>Not authenticated</div>
  }

  return <div>Welcome, {session.user?.name}</div>
}
```

### Protecting Routes

Routes are protected via middleware (`middleware.ts`). Currently protected:
- `/dashboard/*` - Dashboard and all sub-routes
- `/clients/*` - Client management routes
- `/settings/*` - Settings routes
- `/api/*` - API routes (except auth routes)

**To add more protected routes**, update `middleware.ts`:

```typescript
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/settings/:path*",
    "/api/:path*",
    "/admin/:path*",  // Add new protected route
  ],
}
```

### Accessing User Data

**In API Routes**:

```typescript
// app/api/profile/route.ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    user: session.user,
    email: session.user?.email,
  })
}
```

**In Client Components**:

```typescript
"use client"

import { useAuth } from "@/hooks/use-auth"

export function Profile() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) return null

  return (
    <div>
      <img src={user?.image || ""} alt={user?.name || ""} />
      <p>{user?.name}</p>
      <p>{user?.email}</p>
    </div>
  )
}
```

## Database Schema

### User Table

Stores authenticated user information:

```sql
CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  emailVerified TIMESTAMP,
  image TEXT,
  role TEXT DEFAULT 'USER',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Account Table

Stores OAuth provider information:

```sql
CREATE TABLE "Account" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE
);
```

### Session Table

Stores active user sessions:

```sql
CREATE TABLE "Session" (
  id TEXT PRIMARY KEY,
  sessionToken TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL,
  expires TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE
);
```

## Configuration Details

### NextAuth.js Configuration (`auth.ts`)

**Providers**:
- Google OAuth with client ID and secret from environment variables

**Adapter**:
- Prisma adapter for storing sessions and user data in PostgreSQL

**Callbacks**:
- `jwt()` - Called when JWT is created/updated, adds user ID to token
- `session()` - Called when session is checked, adds user ID to session object

**Pages**:
- Sign-in: `/auth/signin`
- Error: `/auth/error`

**Debug Mode**:
- Enabled in development for troubleshooting

### Middleware Configuration (`middleware.ts`)

**Protected Routes**:
- `/dashboard/*` - Dashboard pages
- `/clients/*` - Client management
- `/settings/*` - User settings
- `/api/*` - API endpoints (except auth)

**Public Routes**:
- `/` - Home page
- `/auth/*` - Authentication pages
- `/api/auth/*` - NextAuth API routes

## Troubleshooting

### Issue: "Error connecting to Google"

**Cause**: Google OAuth credentials are invalid or not configured

**Solution**:
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
2. Check that credentials are correct in Google Cloud Console
3. Ensure redirect URI is configured in Google Cloud Console

### Issue: "Session not found"

**Cause**: SessionProvider not wrapping the app

**Solution**:
1. Verify `Providers` component is used in `app/layout.tsx`
2. Check that `SessionProvider` is imported correctly
3. Ensure layout.tsx is using the Providers component

### Issue: "User not created in database"

**Cause**: Database tables not created or Prisma not configured

**Solution**:
1. Run `npx prisma migrate dev --name add_auth_tables`
2. Verify database connection in `.env.local`
3. Check that Prisma schema is correct

### Issue: "Protected routes not working"

**Cause**: Middleware not configured correctly

**Solution**:
1. Verify `middleware.ts` exists in project root
2. Check that route patterns match your protected routes
3. Ensure middleware is exporting correct config

### Issue: "NEXTAUTH_SECRET not set"

**Cause**: Environment variable not configured

**Solution**:
1. Generate secret: `openssl rand -base64 32`
2. Add to `.env.local`: `NEXTAUTH_SECRET="your-generated-secret"`
3. Restart development server

## Security Best Practices

✅ **Implemented**:
- Credentials stored in environment variables (not in code)
- HTTPS enforced in production (via NEXTAUTH_URL)
- Secure session tokens
- CSRF protection via NextAuth.js
- Webhook signature validation (if using webhooks)

✅ **Recommended**:
- Use strong `NEXTAUTH_SECRET` in production
- Enable HTTPS in production
- Set `NEXTAUTH_URL` to production domain
- Regularly rotate API credentials
- Monitor authentication logs
- Implement rate limiting on auth endpoints
- Use secure cookies (httpOnly, secure, sameSite)

## Production Deployment

### Before Deploying

1. **Generate secure secret**:
   ```bash
   openssl rand -base64 32
   ```

2. **Update environment variables**:
   ```bash
   NEXTAUTH_SECRET="your-generated-secret"
   NEXTAUTH_URL="https://yourdomain.com"
   NEXT_PUBLIC_APP_URL="https://yourdomain.com"
   ```

3. **Update Google OAuth redirect URI**:
   - Go to Google Cloud Console
   - Add `https://yourdomain.com/api/auth/callback/google` to authorized redirect URIs

4. **Verify database**:
   - Ensure production database is configured
   - Run migrations: `npx prisma migrate deploy`

5. **Test authentication**:
   - Test sign-in flow
   - Test protected routes
   - Verify user data is stored correctly

### Deployment Platforms

**Vercel** (recommended for Next.js):
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy - Vercel handles everything automatically

**Other Platforms**:
1. Set environment variables
2. Run migrations: `npx prisma migrate deploy`
3. Start application: `npm run build && npm start`

## API Reference

### NextAuth.js Functions

**`auth()`** - Get current session (server-side):
```typescript
const session = await auth()
```

**`signIn()`** - Trigger sign-in flow:
```typescript
await signIn("google", { redirectTo: "/dashboard" })
```

**`signOut()`** - Sign out user:
```typescript
await signOut({ redirectTo: "/" })
```

**`useSession()`** - Get session in client component:
```typescript
const { data: session, status } = useSession()
```

### Custom Hook

**`useAuth()`** - Custom authentication hook:
```typescript
const { user, session, status, isAuthenticated, isLoading, signOut } = useAuth()
```

## Additional Resources

- [NextAuth.js Documentation](https://authjs.dev/)
- [NextAuth.js Google Provider](https://authjs.dev/providers/google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review NextAuth.js documentation
3. Check Google Cloud Console configuration
4. Review application logs for errors

---

**Version**: 1.0
**Last Updated**: April 10, 2026
**Status**: ✅ Ready for Production
