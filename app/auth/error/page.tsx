import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

/**
 * Authentication Error Page
 * 
 * Displays when authentication fails
 * Shows error message and provides option to retry
 */

export default function ErrorPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const error = searchParams.error || "Unknown error"

  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    OAuthSignin: "Error connecting to Google. Please try again.",
    OAuthCallback: "Error during Google authentication. Please try again.",
    OAuthCreateAccount: "Could not create account. Please try again.",
    EmailCreateAccount: "Could not create account with email. Please try again.",
    Callback: "Error during authentication callback. Please try again.",
    OAuthAccountNotLinked:
      "Email already exists with a different provider. Please sign in with that provider.",
    EmailSignInError: "Email sign in failed. Please try again.",
    CredentialsSignin: "Invalid credentials. Please try again.",
    default: "Authentication failed. Please try again.",
  }

  const message = errorMessages[error] || errorMessages.default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <Card className="w-full max-w-md p-8">
        {/* Error Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Authentication Error
          </h1>
          <p className="text-slate-600">{message}</p>
        </div>

        {/* Error Details */}
        {error && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-mono">Error: {error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/auth/signin" className="block">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Try Again
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button
              variant="outline"
              className="w-full"
            >
              Go Home
            </Button>
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-center text-sm text-slate-600">
            Still having trouble?{" "}
            <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}
