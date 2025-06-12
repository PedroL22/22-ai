import { z } from 'zod'

import { env } from '~/env'
import { getUserEmail } from '~/lib/clerk-user'
import { type ChatMessage, createChatCompletion, createStreamingChatCompletion } from '~/lib/openai'
import { ensureUserExists } from '~/lib/user-sync'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'

const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
})

const chatMessageSchemaType = chatMessageSchema as z.ZodType<ChatMessage>

export const chatRouter = createTRPCRouter({
  sendMessage: publicProcedure
    .input(
      z.object({
        messages: z.array(chatMessageSchema),
        model: z.string().optional().default(env.OPENROUTER_DEFAULT_MODEL),
      })
    )
    .mutation(async ({ input }) => {
      const { messages, model } = input

      const result = await createChatCompletion(messages as ChatMessage[], model)

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate response')
      }

      return {
        message: result.message,
        model: model,
        usage: result.usage,
      }
    }),

  streamMessage: publicProcedure
    .input(
      z.object({
        messages: z.array(chatMessageSchema),
        model: z.string().optional().default(env.OPENROUTER_DEFAULT_MODEL),
      })
    )
    .mutation(async ({ input }) => {
      const { messages, model } = input

      try {
        const stream = await createStreamingChatCompletion(messages as ChatMessage[], model)

        let fullResponse = ''

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || ''
          fullResponse += content
        }

        return {
          message: fullResponse,
        }
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to stream response')
      }
    }),

  createChat: protectedProcedure
    .input(
      z.object({
        title: z.string().optional(),
        firstMessage: z.string(),
        model: z.string().optional().default(env.OPENROUTER_DEFAULT_MODEL),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { title, firstMessage, model } = input
      const userId = ctx.auth.userId!
      const userEmail = getUserEmail(ctx.user)

      await ensureUserExists(userId, userEmail)

      const chat = await ctx.db.chat.create({
        data: {
          title: title || `Chat ${new Date().toLocaleDateString()}`,
          userId,
        },
      })

      await ctx.db.message.create({
        data: {
          role: 'user',
          content: firstMessage,
          userId,
          chatId: chat.id,
        },
      })

      const result = await createChatCompletion([{ role: 'user', content: firstMessage }], model)

      if (result.success) {
        await ctx.db.message.create({
          data: {
            role: 'assistant',
            content: result.message || 'No response generated',
            modelId: model,
            userId,
            chatId: chat.id,
          },
        })
      }

      return {
        chatId: chat.id,
        success: result.success,
        message: result.success ? result.message || 'No response generated' : result.error || 'Unknown error',
      }
    }),

  deleteChat: protectedProcedure.input(z.object({ chatId: z.string() })).mutation(async ({ ctx, input }) => {
    const userId = ctx.auth.userId!
    const { chatId } = input
    const userEmail = getUserEmail(ctx.user)

    await ensureUserExists(userId, userEmail)

    const chat = await ctx.db.chat.findFirst({
      where: { id: chatId, userId },
    })
    if (!chat) {
      throw new Error('Chat not found or access denied')
    }

    await ctx.db.chat.delete({
      where: { id: chatId },
    })
    return { success: true, message: 'Chat deleted successfully' }
  }),

  getUserChats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId!
    const userEmail = getUserEmail(ctx.user)

    await ensureUserExists(userId, userEmail)

    return await ctx.db.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    })
  }),

  getChatMessages: protectedProcedure.input(z.object({ chatId: z.string() })).query(async ({ ctx, input }) => {
    const userId = ctx.auth.userId!

    return await ctx.db.message.findMany({
      where: {
        chatId: input.chatId,
        userId,
      },
      orderBy: { createdAt: 'asc' },
    })
  }),

  sendMessageToChat: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        message: z.string(),
        model: z.string().optional().default(env.OPENROUTER_DEFAULT_MODEL),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { chatId, message, model } = input
      const userId = ctx.auth.userId!

      const chat = await ctx.db.chat.findFirst({
        where: { id: chatId, userId },
      })

      if (!chat) {
        throw new Error('Chat not found or access denied')
      }

      await ctx.db.message.create({
        data: {
          role: 'user',
          content: message,
          userId,
          chatId,
        },
      })

      const messages = await ctx.db.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'asc' },
        take: 20,
      })

      const chatMessages: ChatMessage[] = messages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }))

      chatMessages.push({ role: 'user', content: message })

      const result = await createChatCompletion(chatMessages, model)

      if (result.success) {
        await ctx.db.message.create({
          data: {
            role: 'assistant',
            content: result.message || 'No response generated',
            modelId: model,
            userId,
            chatId,
          },
        })

        await ctx.db.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() },
        })
      }

      return {
        success: result.success,
        message: result.success ? result.message || 'No response generated' : result.error || 'Unknown error',
        model: model,
      }
    }),

  syncLocalChats: protectedProcedure
    .input(
      z.object({
        localChats: z.array(
          z.object({
            id: z.string(),
            title: z.string().optional(),
            createdAt: z.string().or(z.date()),
            updatedAt: z.string().or(z.date()),
            messages: z.array(
              z.object({
                id: z.string(),
                role: z.enum(['user', 'assistant']),
                content: z.string(),
                modelId: z.string().nullable(),
                createdAt: z.string().or(z.date()),
              })
            ),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId!
      const userEmail = getUserEmail(ctx.user)
      const { localChats } = input

      await ensureUserExists(userId, userEmail)

      let syncedCount = 0
      const errors: string[] = []
      const chatIdMapping: Record<string, string> = {}

      for (const localChat of localChats) {
        try {
          const dbChat = await ctx.db.chat.create({
            data: {
              title: localChat.title || `Chat ${new Date(localChat.createdAt).toLocaleDateString()}`,
              userId,
              createdAt: new Date(localChat.createdAt),
              updatedAt: new Date(localChat.updatedAt),
            },
          })

          chatIdMapping[localChat.id] = dbChat.id

          if (localChat.messages.length > 0) {
            await ctx.db.message.createMany({
              data: localChat.messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
                modelId: msg.modelId,
                userId,
                chatId: dbChat.id,
                createdAt: new Date(msg.createdAt),
              })),
            })
          }

          syncedCount++
        } catch (error) {
          console.error(`Failed to sync chat ${localChat.id}:`, error)
          errors.push(
            `Failed to sync chat "${localChat.title || 'Untitled'}": ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }

      return {
        synced: syncedCount,
        errors,
        chatIdMapping,
      }
    }),

  createUniversalChat: publicProcedure
    .input(
      z.object({
        title: z.string().optional(),
        firstMessage: z.string(),
        model: z.string().optional().default(env.OPENROUTER_DEFAULT_MODEL),
        useDatabase: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { firstMessage, model } = input

      const result = await createChatCompletion([{ role: 'user', content: firstMessage }], model)

      return {
        success: result.success,
        message: result.success ? result.message || 'No response generated' : result.error || 'Unknown error',
        userMessage: firstMessage,
        modelUsed: model,
      }
    }),

  createChatWithAutoTitle: protectedProcedure
    .input(
      z.object({
        firstMessage: z.string(),
        model: z.string().optional().default(env.OPENROUTER_DEFAULT_MODEL),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { firstMessage, model } = input
      const userId = ctx.auth.userId!
      const userEmail = getUserEmail(ctx.user)

      await ensureUserExists(userId, userEmail)

      const titleResult = await createChatCompletion([
        {
          role: 'system',
          content:
            "You are a helpful assistant that generates concise, descriptive chat titles (3-6 words) based on the user's first message. Respond only with the title, no additional text or punctuation.",
        },
        {
          role: 'user',
          content: `Generate a concise title for a chat that starts with this message: "${firstMessage}"`,
        },
      ])

      const title = titleResult.success ? titleResult.message?.trim().replace(/"/g, '') : 'New chat'

      const chat = await ctx.db.chat.create({
        data: {
          title,
          userId,
        },
      })

      await ctx.db.message.create({
        data: {
          role: 'user',
          content: firstMessage,
          userId,
          chatId: chat.id,
        },
      })

      const result = await createChatCompletion([{ role: 'user', content: firstMessage }], model)

      if (result.success) {
        await ctx.db.message.create({
          data: {
            role: 'assistant',
            content: result.message || 'No response generated',
            modelId: model,
            userId,
            chatId: chat.id,
          },
        })
      }

      return {
        chatId: chat.id,
        title: chat.title,
        model: model,
        success: result.success,
        message: result.success ? result.message || 'No response generated' : result.error || 'Unknown error',
      }
    }),

  generateChatTitle: publicProcedure.input(z.object({ message: z.string() })).mutation(async ({ input }) => {
    const { message } = input

    try {
      const result = await createChatCompletion([
        {
          role: 'system',
          content:
            "You are a helpful assistant that generates concise, descriptive chat titles (3-6 words) based on the user's first message. Respond only with the title, no additional text or punctuation.",
        },
        {
          role: 'user',
          content: `Generate a concise title for a chat that starts with this message: "${message}"`,
        },
      ])

      return {
        success: result.success,
        title: result.success ? result.message?.trim().replace(/"/g, '') : 'New chat',
      }
    } catch (error) {
      console.error('Failed to generate chat title:', error)
      return {
        success: false,
        title: 'New chat',
      }
    }
  }),

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
    ]
  }),
})
