"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

/**
 * User Menu Component
 * 
 * Displays authenticated user's profile picture and name
 * Provides dropdown menu with:
 * - Profile settings
 * - Account settings
 * - Sign out option
 * 
 * Shows loading state while authentication is being checked
 * Shows sign in button if user is not authenticated
 */

export function UserMenu() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth()

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
    )
  }

  // Show sign in button if not authenticated
  if (!isAuthenticated) {
    return (
      <Link href="/auth/signin">
        <Button variant="default" size="sm">
          Sign In
        </Button>
      </Link>
    )
  }

  // Show user menu if authenticated
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative w-10 h-10 rounded-full p-0">
          <Avatar className="w-10 h-10">
            {/* User's profile image from Google */}
            <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
            {/* Fallback: initials from user's name */}
            <AvatarFallback>
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* User info header */}
        <DropdownMenuLabel className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{user?.name}</p>
          <p className="text-xs leading-none text-muted-foreground">
            {user?.email}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Menu items */}
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">Profile Settings</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings/account">Account Settings</Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sign out */}
        <DropdownMenuItem
          onClick={signOut}
          className="text-red-600 focus:text-red-600 cursor-pointer"
        >
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
