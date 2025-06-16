import OpenAI from 'openai'

import { env } from '~/env.js'
import { tryCatch } from '~/utils/try-catch'

import type { ModelsIds } from '~/types/models'

export const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': env.OPENROUTER_SITE_URL,
    'X-Title': env.OPENROUTER_SITE_NAME,
  },
})

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export const createChatCompletion = async (messages: ChatMessage[], modelId: ModelsIds) => {
  const { data, error } = await tryCatch(
    openai.chat.completions.create({
      model: modelId ?? (env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL as ModelsIds),
      messages,
      temperature: 0.7,
      max_completion_tokens: 1000,
    })
  )

  if (error) {
    console.error('❌ OpenAI API error: ', error)

    return {
      success: false,
      error: error.message || 'Unknown error occurred.',
    }
  }

  return {
    success: true,
    message: data.choices[0]?.message?.content || '',
    usage: data.usage,
  }
}

export const createChatCompletionStream = async (messages: ChatMessage[], modelId: ModelsIds) => {
  const { data, error } = await tryCatch(
    openai.chat.completions.create({
      model: modelId ?? (env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL as ModelsIds),
      messages,
      temperature: 0.7,
      max_completion_tokens: 1000,
      stream: true,
    })
  )

  if (error) {
    console.error('❌ OpenAI API error: ', error)

    return {
      success: false,
      error: error.message || 'Unknown error occurred.',
      stream: null,
    }
  }

  return {
    success: true,
    stream: data,
  }
}
