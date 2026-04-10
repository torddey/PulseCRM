-- ============================================================================
-- NEXTAUTH.JS AUTHENTICATION TABLES
-- ============================================================================
-- These tables are required by NextAuth.js for session and account management
-- They store user accounts, sessions, and OAuth provider information

-- Account table: Stores OAuth account information
-- Links user accounts to external providers (Google, GitHub, etc.)
CREATE TABLE IF NOT EXISTS "Account" (
  id TEXT NOT NULL PRIMARY KEY,
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
  UNIQUE(provider, providerAccountId),
  FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE
);

-- Session table: Stores user session information
-- Manages active user sessions for authentication
CREATE TABLE IF NOT EXISTS "Session" (
  id TEXT NOT NULL PRIMARY KEY,
  sessionToken TEXT NOT NULL UNIQUE,
  userId TEXT NOT NULL,
  expires TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE
);

-- User table: Core user entity for authentication
-- Stores user profile information and authentication details
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  emailVerified TIMESTAMP,
  image TEXT,
  role TEXT NOT NULL DEFAULT 'USER',
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- VerificationToken table: For email verification flows
-- Stores temporary tokens for email verification
CREATE TABLE IF NOT EXISTS "VerificationToken" (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMP NOT NULL,
  UNIQUE(identifier, token)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"(userId);
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"(userId);
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"(email);
