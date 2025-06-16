import OpenAI from 'openai'

import { env } from '~/env.js'
import { cycleToNextApiKeyServerSide, getCurrentApiKey } from './api-key-manager'

import type { ModelsIds } from '~/types/models'

// Create a function to get a fresh OpenAI client with the current API key
const createOpenAIClient = (apiKey?: string): OpenAI => {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey || getCurrentApiKey(),
    defaultHeaders: {
      'HTTP-Referer': env.OPENROUTER_SITE_URL,
      'X-Title': env.OPENROUTER_SITE_NAME,
    },
  })
}

export const openai = createOpenAIClient()

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const isFailoverError = (error: any): boolean => {
  // Since the API always returns 500 regardless of the actual error,
  // we'll treat any API error as a potential rate limit or server issue
  return (
    error?.status === 500 ||
    error?.status === 502 ||
    error?.status === 503 ||
    error?.status === 504 ||
    error?.status === 429 ||
    error?.message?.includes('500') ||
    error?.message?.includes('429') ||
    error?.message?.includes('rate limit') ||
    error?.message?.includes('quota') ||
    error?.message?.includes('limit exceeded') ||
    error?.message?.includes('server error') ||
    error?.message?.includes('API') // Catch generic API errors
  )
}

const makeApiCallWithFallback = async <T>(
  apiCall: (client: OpenAI) => Promise<T>,
  maxRetries = 5 // Maximum number of retries for API calls
): Promise<{ success: true; data: T } | { success: false; error: string }> => {
  let lastError: any = null
  let attempts = 0

  while (attempts < maxRetries) {
    try {
      const client = createOpenAIClient()
      const result = await apiCall(client)
      return { success: true, data: result }
    } catch (error) {
      lastError = error
      attempts++

      console.error(`❌ OpenRouter API error (attempt ${attempts}/${maxRetries}): `, error)

      // Only cycle to next key if it's a failover error and we have more attempts
      if (isFailoverError(error) && attempts < maxRetries) {
        // Since we can't distinguish error types, we'll assume any API error
        // could be a rate limit issue and cycle to the next key
        console.log('🔄 API error detected (potentially rate limited), cycling to next API key...')

        // Use server-side cycling for now (client-side will be handled differently)
        cycleToNextApiKeyServerSide()
        continue
      }

      // If it's not a failover error, don't retry
      if (!isFailoverError(error)) {
        break
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Unknown error occurred after all retries.',
  }
}

export const createChatCompletion = async (messages: ChatMessage[], modelId: ModelsIds) => {
  const result = await makeApiCallWithFallback((client) =>
    client.chat.completions.create({
      model: modelId ?? (env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL as ModelsIds),
      messages,
      temperature: 0.7,
      max_completion_tokens: 1000,
    })
  )

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    }
  }

  return {
    success: true,
    message: result.data.choices[0]?.message?.content || '',
    usage: result.data.usage,
  }
}

export const createChatCompletionStream = async (messages: ChatMessage[], modelId: ModelsIds) => {
  const result = await makeApiCallWithFallback((client) =>
    client.chat.completions.create({
      model: modelId ?? (env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL as ModelsIds),
      messages,
      temperature: 0.7,
      max_completion_tokens: 1000,
      stream: true,
    })
  )

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      stream: null,
    }
  }

  return {
    success: true,
    stream: result.data,
  }
}
