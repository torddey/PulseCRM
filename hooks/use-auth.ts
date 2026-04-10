"use client"

import { useSession, signOut as nextAuthSignOut } from "next-auth/react"
import { useRouter } from "next/navigation"

/**
 * Custom hook for authentication
 * 
 * Provides easy access to:
 * - Current user session
 * - Loading state
 * - Sign out functionality
 * - Authentication status
 * 
 * Usage:
 * const { session, status, user, signOut } = useAuth()
 * 
 * if (status === "loading") return <div>Loading...</div>
 * if (status === "unauthenticated") return <div>Not signed in</div>
 * 
 * return <div>Welcome, {user?.name}</div>
 */

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  /**
   * Sign out user and redirect to home page
   */
  const signOut = async () => {
    await nextAuthSignOut({ redirect: false })
    router.push("/")
  }

  return {
    // Session data
    session,
    user: session?.user,
    
    // Authentication status
    status, // "loading" | "authenticated" | "unauthenticated"
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isUnauthenticated: status === "unauthenticated",
    
    // Sign out function
    signOut,
  }
}
