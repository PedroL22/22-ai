import { z } from 'zod'

import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'

export const usersRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    // Mock users data
    return [
      { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: new Date() },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date() },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', createdAt: new Date() },
    ]
  }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: new Date() },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date() },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', createdAt: new Date() },
    ]

    const user = mockUsers.find((u) => u.id === input.id)
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }
    return user
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock creation
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        name: input.name,
        email: input.email,
        createdAt: new Date(),
      }
      return newUser
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock update
      return {
        id: input.id,
        name: input.name ?? 'Updated User',
        email: input.email ?? 'updated@example.com',
        createdAt: new Date(),
      }
    }),

  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    // Mock deletion
    return { success: true, id: input.id }
  }),
})
