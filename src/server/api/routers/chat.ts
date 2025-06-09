import { z } from 'zod'

import { env } from '~/env'
import { type ChatMessage, createChatCompletion, createStreamingChatCompletion } from '~/lib/openai'
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'

const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
})

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

        // Convert the stream to a readable format for the client
        // Note: This is a simplified version. For real streaming, you'd want to use
        // tRPC subscriptions or Server-Sent Events
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

  getModels: publicProcedure.query(async () => {
    // Return a list of available models from OpenRouter
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
