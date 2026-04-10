/**
 * Database client singleton for Prisma
 * Ensures only one instance of PrismaClient is created
 * Prevents connection pool exhaustion in development
 */

import { PrismaClient } from '@prisma/client'

// Declare global type for Prisma client
declare global {
  var prisma: PrismaClient | undefined
}

// Create or reuse existing Prisma client
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  })

// In development, store the client in global to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma
