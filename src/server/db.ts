import { PrismaClient } from '@prisma/client'

export type * from '@prisma/client'

const globalForPrisma = globalThis as { prisma?: PrismaClient }

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

globalForPrisma.prisma = db
