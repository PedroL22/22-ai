import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const userRouter = createTRPCRouter({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    let userSettings = await ctx.db.userSettings.findUnique({
      where: { userId: ctx.auth.userId },
    })

    if (!userSettings) {
      userSettings = await ctx.db.userSettings.create({
        data: {
          userId: ctx.auth.userId,
          syncWithDb: null,
          language: 'en',
        },
      })
    }

    return userSettings
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        syncWithDb: z.string().optional(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedSettings = await ctx.db.userSettings.upsert({
        where: { userId: ctx.auth.userId },
        update: {
          ...input,
          updatedAt: new Date(),
        },
        create: {
          userId: ctx.auth.userId,
          ...input,
        },
      })

      return updatedSettings
    }),

  getUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
      include: {
        UserSettings: true,
      },
    })

    return user
  }),
})
