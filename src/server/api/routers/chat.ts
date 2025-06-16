import { z } from 'zod'

import { createChatCompletion } from '~/lib/openai'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { tryCatch } from '~/utils/try-catch'

import { env } from '~/env'

import type { ModelsIds } from '~/types/models'
import { MODELS } from '~/types/models'

const MODEL_IDS = MODELS.map((model) => model.id) as [ModelsIds, ...ModelsIds[]]

const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
})

export const chatRouter = createTRPCRouter({
  sendMessage: publicProcedure
    .input(
      z.object({
        messages: z.array(chatMessageSchema),
        modelId: z
          .enum(MODEL_IDS)
          .optional()
          .default(env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL as ModelsIds),
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await tryCatch(createChatCompletion(input.messages, input.modelId as ModelsIds))

      if (error) {
        console.error('❌ Error sending message: ', error)

        return {
          success: false,
          message: 'Failed to send message.',
        }
      }

      return {
        success: true,
        message: data.message?.trim().replace(/"/g, ''),
      }
    }),

  generateChatTitle: publicProcedure.input(z.object({ firstMessage: z.string() })).mutation(async ({ input }) => {
    console.log('🎯 tRPC: Starting title generation for message: ', input.firstMessage)

    const { data, error } = await tryCatch(
      createChatCompletion(
        [
          {
            role: 'system',
            content:
              "You are a helpful assistant that generates concise, descriptive chat titles (3-6 words) based on the user's first message. Respond only with the title, no additional text or punctuation.",
          },
          {
            role: 'user',
            content: `Generate a concise title for a chat that starts with this message: "${input.firstMessage}"`,
          },
        ],
        env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL as ModelsIds
      )
    )

    if (error) {
      console.error('❌ Error generating chat title: ', error)

      return {
        success: false,
        title: 'New chat',
      }
    }

    return {
      success: true,
      title: data.message?.trim().replace(/"/g, '') || 'New chat',
    }
  }),

  createChat: protectedProcedure
    .input(
      z.object({
        title: z.string().optional(),
        firstMessage: z.string(),
        modelId: z
          .enum(MODEL_IDS)
          .optional()
          .default(env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL as ModelsIds),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ensureUserExists = await ctx.db.user.findUnique({ where: { id: ctx.auth.userId! } })

      if (!ensureUserExists) {
        throw new Error('User not found.')
      }

      const chat = await ctx.db.chat.create({
        data: {
          title: input.title || `Chat ${new Date().toLocaleDateString('en-US')}`,
          userId: ctx.auth.userId!,
        },
      })

      await ctx.db.message.create({
        data: {
          role: 'user',
          content: input.firstMessage,
          userId: ctx.auth.userId!,
          chatId: chat.id,
        },
      })

      const result = await createChatCompletion([{ role: 'user', content: input.firstMessage }], input.modelId)

      if (!result.success) {
        console.error('❌ Error creating chat: ', result.error || 'Unknown error occurred.')

        return {
          success: false,
          chatId: chat.id,
        }
      }

      if (result.success && result.message) {
        await ctx.db.message.create({
          data: {
            role: 'assistant',
            content: result.message,
            modelId: input.modelId,
            userId: ctx.auth.userId!,
            chatId: chat.id,
          },
        })

        return {
          success: true,
          chatId: chat.id,
          message: result.message,
        }
      }
    }),

  renameChat: protectedProcedure
    .input(z.object({ chatId: z.string(), newTitle: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const chat = await ctx.db.chat.findUnique({ where: { id: input.chatId } })

      if (!chat) {
        throw new Error('Chat not found.')
      }

      await ctx.db.chat.update({
        where: { id: input.chatId },
        data: { title: input.newTitle },
      })

      return {
        success: true,
        chatId: input.chatId,
        newTitle: input.newTitle,
      }
    }),

  deleteChat: protectedProcedure.input(z.object({ chatId: z.string() })).mutation(async ({ ctx, input }) => {
    const chat = await ctx.db.chat.findUnique({ where: { id: input.chatId } })

    if (!chat) {
      throw new Error('Chat not found.')
    }

    await ctx.db.chat.delete({ where: { id: input.chatId } })

    return {
      success: true,
    }
  }),

  pinChat: protectedProcedure
    .input(z.object({ chatId: z.string(), isPinned: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const chat = await ctx.db.chat.findUnique({ where: { id: input.chatId } })

      if (!chat) {
        throw new Error('Chat not found.')
      }

      await ctx.db.chat.update({
        where: { id: input.chatId },
        data: { isPinned: input.isPinned },
      })

      return {
        success: true,
        chatId: input.chatId,
        isPinned: input.isPinned,
      }
    }),

  shareChat: protectedProcedure
    .input(z.object({ chatId: z.string(), isShared: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const chat = await ctx.db.chat.findUnique({ where: { id: input.chatId } })

      if (!chat) {
        throw new Error('Chat not found.')
      }

      await ctx.db.chat.update({
        where: { id: input.chatId },
        data: { isShared: input.isShared },
      })

      return {
        success: true,
        chatId: input.chatId,
        isShared: input.isShared,
      }
    }),

  getUserChats: protectedProcedure.query(async ({ ctx }) => {
    const ensureUserExists = await ctx.db.user.findUnique({ where: { id: ctx.auth.userId! } })

    if (!ensureUserExists) {
      throw new Error('User not found.')
    }

    const userChats = await ctx.db.chat.findMany({
      where: { userId: ctx.auth.userId! },
      orderBy: { createdAt: 'desc' },
    })

    return userChats.map((chat) => ({
      id: chat.id,
      title: chat.title,
      isPinned: chat.isPinned,
      isShared: chat.isShared,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      userId: chat.userId,
    }))
  }),

  getChatMessages: protectedProcedure.input(z.object({ chatId: z.string() })).query(async ({ ctx, input }) => {
    const chat = await ctx.db.chat.findUnique({ where: { id: input.chatId } })

    if (!chat) {
      throw new Error('Chat not found.')
    }

    const messages = await ctx.db.message.findMany({
      where: { chatId: input.chatId },
      orderBy: { createdAt: 'asc' },
    })

    return messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    }))
  }),

  sendMessageToChat: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        message: z.string(),
        modelId: z
          .enum(MODEL_IDS)
          .optional()
          .default(env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL as ModelsIds),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ensureUserExists = await ctx.db.user.findUnique({ where: { id: ctx.auth.userId! } })

      if (!ensureUserExists) {
        throw new Error('User not found.')
      }

      const chat = await ctx.db.chat.findUnique({ where: { id: input.chatId } })

      if (!chat) {
        throw new Error('Chat not found.')
      }

      // Save user message to database
      const userMessage = await ctx.db.message.create({
        data: {
          role: 'user',
          content: input.message,
          userId: ctx.auth.userId!,
          chatId: input.chatId,
        },
      })

      // Update chat's updatedAt timestamp
      await ctx.db.chat.update({
        where: { id: input.chatId },
        data: { updatedAt: new Date() },
      })

      return {
        success: true,
        messageId: userMessage.id,
        chatId: input.chatId,
      }
    }),

  syncLocalChatsToDatabase: protectedProcedure
    .input(
      z.object({
        chats: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            createdAt: z.date(),
            updatedAt: z.date(),
            messages: z.array(
              z.object({
                id: z.string(),
                role: z.enum(['user', 'assistant']),
                content: z.string(),
                modelId: z.string().nullable(),
                createdAt: z.date(),
              })
            ),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ensureUserExists = await ctx.db.user.findUnique({ where: { id: ctx.auth.userId! } })

      if (!ensureUserExists) {
        throw new Error('User not found.')
      }

      const syncedChats = []

      for (const localChat of input.chats) {
        // Check if chat already exists in database
        const existingChat = await ctx.db.chat.findUnique({
          where: { id: localChat.id },
        })

        let chat: { id: string; title: string | null; createdAt: Date; updatedAt: Date; userId: string }
        if (!existingChat) {
          // Create new chat in database
          chat = await ctx.db.chat.create({
            data: {
              id: localChat.id,
              title: localChat.title,
              userId: ctx.auth.userId!,
              createdAt: localChat.createdAt,
              updatedAt: localChat.updatedAt,
            },
          })
        } else {
          chat = existingChat
        }

        // Sync messages for this chat
        for (const localMessage of localChat.messages) {
          const existingMessage = await ctx.db.message.findUnique({
            where: { id: localMessage.id },
          })

          if (!existingMessage) {
            await ctx.db.message.create({
              data: {
                id: localMessage.id,
                role: localMessage.role,
                content: localMessage.content,
                modelId: localMessage.modelId,
                userId: ctx.auth.userId!,
                chatId: chat.id,
                createdAt: localMessage.createdAt,
              },
            })
          }
        }

        syncedChats.push(chat)
      }

      return {
        success: true,
        syncedChats,
      }
    }),

  getAllUserChatsWithMessages: protectedProcedure.query(async ({ ctx }) => {
    const ensureUserExists = await ctx.db.user.findUnique({ where: { id: ctx.auth.userId! } })

    if (!ensureUserExists) {
      throw new Error('User not found.')
    }

    const userChatsWithMessages = await ctx.db.chat.findMany({
      where: { userId: ctx.auth.userId! },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return userChatsWithMessages.map((chat) => ({
      id: chat.id,
      title: chat.title,
      isPinned: chat.isPinned,
      isShared: chat.isShared,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      userId: chat.userId,
      messages: chat.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        isError: message.isError,
        modelId: message.modelId,
        createdAt: message.createdAt,
        userId: message.userId,
        chatId: message.chatId,
      })),
    }))
  }),

  clearUserChatsFromDatabase: protectedProcedure.mutation(async ({ ctx }) => {
    const ensureUserExists = await ctx.db.user.findUnique({ where: { id: ctx.auth.userId! } })

    if (!ensureUserExists) {
      throw new Error('User not found.')
    }

    // Delete all chats and their messages for this user
    await ctx.db.chat.deleteMany({
      where: { userId: ctx.auth.userId! },
    })

    return {
      success: true,
      message: 'All user chats deleted from database',
    }
  }),

  syncChatToDatabase: protectedProcedure
    .input(
      z.object({
        chat: z.object({
          id: z.string(),
          title: z.string(),
          createdAt: z.date(),
          updatedAt: z.date(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const chat = await ctx.db.chat.upsert({
          where: { id: input.chat.id },
          update: {
            title: input.chat.title,
            updatedAt: input.chat.updatedAt,
          },
          create: {
            id: input.chat.id,
            title: input.chat.title,
            createdAt: input.chat.createdAt,
            updatedAt: input.chat.updatedAt,
            userId: ctx.auth.userId!,
          },
        })

        return { success: true, chat }
      } catch (error) {
        console.error('❌ Error syncing chat to database: ', error)
        throw new Error('❌ Failed to sync chat to database.')
      }
    }),

  syncMessageToDatabase: protectedProcedure
    .input(
      z.object({
        message: z.object({
          id: z.string(),
          role: z.enum(['user', 'assistant']),
          content: z.string(),
          isError: z.boolean(),
          modelId: z.string().nullable(),
          createdAt: z.date(),
          chatId: z.string(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const message = await ctx.db.message.upsert({
          where: { id: input.message.id },
          update: {
            content: input.message.content,
          },
          create: {
            id: input.message.id,
            role: input.message.role,
            content: input.message.content,
            isError: input.message.isError || false,
            modelId: input.message.modelId,
            createdAt: input.message.createdAt,
            chatId: input.message.chatId,
            userId: ctx.auth.userId!,
          },
        })

        return { success: true, message }
      } catch (error) {
        console.error('❌ Error syncing message to database: ', error)
        throw new Error('❌ Failed to sync message to database.')
      }
    }),

  getSharedChat: publicProcedure.input(z.object({ chatId: z.string() })).query(async ({ ctx, input }) => {
    const chat = await ctx.db.chat.findUnique({
      where: { id: input.chatId },
      include: { user: { select: { id: true, email: true } } },
    })

    if (!chat) {
      throw new Error('Chat not found.')
    }

    if (!chat.isShared) {
      throw new Error('Chat is not shared.')
    }

    const { clerkClient } = await import('@clerk/nextjs/server')
    let ownerName = 'Unknown User'

    try {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(chat.userId)
      ownerName =
        clerkUser.fullName || clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || 'Unknown User'
    } catch (error) {
      console.error('Failed to fetch user from Clerk: ', error)
    }

    return {
      id: chat.id,
      title: chat.title,
      isPinned: chat.isPinned,
      isShared: chat.isShared,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      userId: chat.userId,
      ownerEmail: chat.user.email,
      ownerName,
    }
  }),

  getSharedChatMessages: publicProcedure.input(z.object({ chatId: z.string() })).query(async ({ ctx, input }) => {
    const chat = await ctx.db.chat.findUnique({
      where: { id: input.chatId },
    })

    if (!chat) {
      throw new Error('Chat not found.')
    }

    if (!chat.isShared) {
      throw new Error('Chat is not shared.')
    }

    const messages = await ctx.db.message.findMany({
      where: { chatId: input.chatId },
      orderBy: { createdAt: 'asc' },
    })

    return messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      isError: message.isError,
      modelId: message.modelId,
      createdAt: message.createdAt,
      userId: message.userId,
      chatId: message.chatId,
    }))
  }),

  // Check if current user is the owner of a chat
  isOwnerOfChat: publicProcedure.input(z.object({ chatId: z.string() })).query(async ({ ctx, input }) => {
    const chat = await ctx.db.chat.findUnique({
      where: { id: input.chatId },
    })

    if (!chat) {
      throw new Error('Chat not found.')
    }

    if (!ctx.auth.userId) {
      return { isOwner: false }
    }

    return { isOwner: chat.userId === ctx.auth.userId }
  }),

  deleteMessagesFromIndex: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        messageIndex: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First check if user owns the chat
        const chat = await ctx.db.chat.findUnique({
          where: { id: input.chatId },
        })

        if (!chat) {
          throw new Error('Chat not found.')
        }

        if (chat.userId !== ctx.auth.userId!) {
          throw new Error('You do not have permission to delete messages from this chat.')
        }

        // Get all messages for this chat ordered by creation time
        const messages = await ctx.db.message.findMany({
          where: { chatId: input.chatId },
          orderBy: { createdAt: 'asc' },
        })

        // Find messages to delete (from messageIndex onwards)
        const messagesToDelete = messages.slice(input.messageIndex)

        // Delete messages from database
        if (messagesToDelete.length > 0) {
          await ctx.db.message.deleteMany({
            where: {
              id: {
                in: messagesToDelete.map((msg) => msg.id),
              },
            },
          })
        }

        return {
          success: true,
          deletedCount: messagesToDelete.length,
        }
      } catch (error) {
        console.error('❌ Error deleting messages from database: ', error)
        throw new Error('❌ Failed to delete messages from database.')
      }
    }),
})
