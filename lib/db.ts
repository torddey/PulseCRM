/**
 * Database client singleton for Prisma
 * Ensures only one instance of PrismaClient is created
 * Prevents connection pool exhaustion in development
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Declare global type for Prisma client
declare global {
  var prisma: PrismaClient | undefined
}

// Create or reuse existing Prisma client
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || '',
})

export const prisma =
  global.prisma ||
  new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  })

// In development, store the client in global to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma
