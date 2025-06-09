import OpenAI from 'openai'

import { env } from '~/env.js'

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

export async function createChatCompletion(messages: ChatMessage[], model = env.OPENROUTER_DEFAULT_MODEL) {
  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_completion_tokens: 1000,
    })

    return {
      success: true,
      message: completion.choices[0]?.message?.content || '',
      usage: completion.usage,
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function createStreamingChatCompletion(messages: ChatMessage[], model = env.OPENROUTER_DEFAULT_MODEL) {
  const stream = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 1000,
    stream: true,
  })

  return stream
}
