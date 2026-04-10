"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"

/**
 * Providers Component
 * 
 * Wraps the entire application with necessary providers:
 * - SessionProvider: Enables NextAuth.js session management
 * - Makes useSession() hook available throughout the app
 * - Handles session state and authentication context
 * 
 * This component must wrap the entire app in layout.tsx
 */

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}
