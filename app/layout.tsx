/**
 * Root Layout for CRM Application
 * Sets up global styles, metadata, and providers
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Proactive AI Relationship Manager - Smart CRM',
    template: '%s | AI CRM',
  },
  description:
    'Never lose a client silently again. AI-powered relationship manager with smart follow-ups, complaint tracking, and client health dashboard.',
  keywords: [
    'CRM',
    'Client Management',
    'AI Assistant',
    'Follow-up Engine',
    'Complaint Tracker',
    'Customer Relationship',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://crm-relationship-manager.vercel.app',
    siteName: 'AI Relationship Manager',
    title: 'Proactive AI Relationship Manager',
    description:
      'Smart CRM with AI-powered client engagement, automated follow-ups, and complaint tracking.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Relationship Manager',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Proactive AI Relationship Manager',
    description: 'Never lose a client silently again',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Proactive AI Relationship Manager',
              description:
                'AI-powered CRM for managing client relationships with smart follow-ups and complaint tracking',
              applicationCategory: 'BusinessApplication',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
        {children}
      </body>
    </html>
  )
}
