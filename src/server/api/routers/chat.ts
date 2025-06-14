import { z } from 'zod'

import { createChatCompletion } from '~/lib/openai'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { tryCatch } from '~/utils/try-catch'

import { env } from '~/env'
import type { Model, ModelsIds } from '~/types/models'
import { MODEL_IDS } from '~/types/models'

const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
})

export const chatRouter = createTRPCRouter({
  getModels: publicProcedure.query(async () => {
    return [
      {
        id: 'google/gemini-2.0-flash-exp:free',
        name: 'Gemini 2.0 Flash Experimental',
        developer: 'Google',
        description:
          'Gemini Flash 2.0 offers a significantly faster time to first token (TTFT) compared to Gemini Flash 1.5, while maintaining quality on par with larger models like Gemini Pro 1.5. It introduces notable enhancements in multimodal understanding, coding capabilities, complex instruction following, and function calling. These advancements come together to deliver more seamless and robust agentic experiences.',
      },
      {
        id: 'google/gemma-3-27b-it:free',
        name: 'Gemma 3 27B',
        developer: 'Google',
        description:
          "Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling. Gemma 3 27B is Google's latest open source model, successor to Gemma 2.",
      },
      {
        id: 'deepseek/deepseek-chat-v3-0324:free',
        name: 'DeepSeek V3 0324',
        developer: 'DeepSeek',
        description:
          'DeepSeek V3, a 685B-parameter, mixture-of-experts model, is the latest iteration of the flagship chat model family from the DeepSeek team. It succeeds the DeepSeek V3 model and performs really well on a variety of tasks.',
      },
      {
        id: 'deepseek/deepseek-r1-0528:free',
        name: 'R1 0528',
        developer: 'DeepSeek',
        description:
          "May 28th update to the original DeepSeek R1 Performance on par with OpenAI o1, but open-sourced and with fully open reasoning tokens. It's 671B parameters in size, with 37B active in an inference pass.",
      },
      {
        id: 'tngtech/deepseek-r1t-chimera:free',
        name: 'DeepSeek R1T Chimera',
        developer: 'TNG',
        description:
          'DeepSeek-R1T-Chimera is created by merging DeepSeek-R1 and DeepSeek-V3 (0324), combining the reasoning capabilities of R1 with the token efficiency improvements of V3. It is based on a DeepSeek-MoE Transformer architecture and is optimized for general text generation tasks. The model merges pre-trained weights from both source models to balance performance across reasoning, efficiency, and instruction-following tasks.',
      },
      {
        id: 'mistralai/devstral-small:free',
        name: 'Devstral Small',
        developer: 'Mistral',
        description:
          'Devstral-Small-2505 is a 24B parameter agentic LLM fine-tuned from Mistral-Small-3.1, jointly developed by Mistral AI and All Hands AI for advanced software engineering tasks. It is optimized for codebase exploration, multi-file editing, and integration into coding agents, achieving state-of-the-art results on SWE-Bench Verified (46.8%).',
      },
    ] as Model[]
  }),

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
      const { data, error } = await tryCatch(createChatCompletion(input.messages, input.modelId))

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
    console.log('🎯 tRPC: Starting title generation for message:', input.firstMessage)

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
          title: input.title || `Chat ${new Date().toLocaleDateString()}`,
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
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      userId: chat.userId,
      messages: chat.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        modelId: message.modelId,
        createdAt: message.createdAt,
        userId: message.userId,
        chatId: message.chatId,
      })),
    }))
  }),
})
