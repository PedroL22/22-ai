import OpenAI from 'openai'

import { env } from '~/env.js'
import { cycleToNextApiKeyServerSide, getCurrentApiKey } from './api-key-manager'

import type { ModelsIds } from '~/types/models'

// Helper to get BYOK API key from zustand (client only)
function getApiKeyForModel(modelId: ModelsIds): string | undefined {
  if (typeof window === 'undefined') return undefined
  // Dynamically import the zustand store to avoid SSR issues
  try {
    const { useApiKeyStore } = require('~/stores/useApiKeyStore')

    if (modelId.startsWith('openai/')) return useApiKeyStore.getState().openaiApiKey || undefined
    if (modelId.startsWith('anthropic/')) return useApiKeyStore.getState().anthropicApiKey || undefined
    if (modelId.startsWith('google/')) return useApiKeyStore.getState().geminiApiKey || undefined
    if (modelId.startsWith('grok/')) return useApiKeyStore.getState().grokApiKey || undefined
  } catch {
    // fallback for SSR or errors
    return undefined
  }
  return undefined
}

// OpenRouter client (for free models only)
const createOpenRouterClient = (apiKey?: string): OpenAI => {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey || getCurrentApiKey(),
    defaultHeaders: {
      'HTTP-Referer': env.OPENROUTER_SITE_URL,
      'X-Title': env.OPENROUTER_SITE_NAME,
    },
  })
}

// Native OpenAI client (for BYOK)
const createNativeOpenAIClient = (apiKey: string): OpenAI => {
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.openai.com/v1',
  })
}

// Anthropic native call (BYOK)
async function createAnthropicChatCompletion(messages: ChatMessage[], modelId: ModelsIds, apiKey: string) {
  const url = 'https://api.anthropic.com/v1/messages'
  const modelName = modelId.replace(/^anthropic\//, '').replace(/:byok$/, '')

  // Correctly separate the system prompt from the conversational history
  const systemPrompt = messages.find((m) => m.role === 'system')?.content
  const conversationMessages = messages.filter((m) => m.role !== 'system')

  const body = {
    model: modelName,
    max_tokens: 1024,
    system: systemPrompt, // Use the dedicated 'system' parameter
    messages: conversationMessages, // Pass the full alternating user/assistant history
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`❌ Anthropic API error: ${await res.text()}`)
  const data = await res.json()
  // The response structure for Claude is {..., "content": [{"type": "text", "text": "..."}]}
  return { success: true, message: data.content?.[0]?.text || '' }
}

// Gemini native call (BYOK)
async function createGeminiChatCompletion(messages: ChatMessage[], modelId: ModelsIds, apiKey: string) {
  const modelName = modelId.replace(/^google\//, '').replace(/:byok$/, '')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

  // Note: Gemini has strict rules about roles. A system prompt is best handled by
  // prepending its content to the first user message for robust conversation flow.
  let systemPrompt = messages.find((m) => m.role === 'system')?.content
  const conversationMessages = messages.filter((m) => m.role !== 'system')

  if (
    systemPrompt &&
    conversationMessages.length > 0 &&
    conversationMessages[0]?.role === 'user' &&
    typeof conversationMessages[0]?.content === 'string'
  ) {
    conversationMessages[0].content = `${systemPrompt}\n\n${conversationMessages[0].content}`
    systemPrompt = undefined
  }

  // Transform roles for Gemini API: 'assistant' must become 'model'
  const contents = conversationMessages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body = { contents: contents }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`❌ Gemini API error: ${await res.text()}`)
  const data = await res.json()
  // The response structure can have safety blocks, so check for candidates first.
  return { success: true, message: data.candidates?.[0]?.content?.parts?.[0]?.text || '' }
}

// Grok native call (BYOK)
async function createGrokChatCompletion(messages: ChatMessage[], modelId: ModelsIds, apiKey: string) {
  const url = 'https://api.x.ai/v1/chat/completions'
  const modelName = modelId.replace(/^grok\//, '').replace(/:byok$/, '')

  const body = {
    model: modelName,
    messages,
    temperature: 0.7,
    max_tokens: 1000,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`❌ Grok API error: ${await res.text()}`)
  const data = await res.json()
  return { success: true, message: data.choices?.[0]?.message?.content || '' }
}

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
      const client = createOpenRouterClient()
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
  // Route based on model
  if (modelId.endsWith(':free')) {
    // OpenRouter (free)
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

  if (modelId.startsWith('openai/')) {
    // BYOK OpenAI
    const apiKey = getApiKeyForModel(modelId)
    if (!apiKey) return { success: false, error: '❌ No OpenAI API key set.' }
    const client = createNativeOpenAIClient(apiKey)
    try {
      const result = await client.chat.completions.create({
        model: modelId.replace(/^openai\//, '').replace(/:byok$/, ''),
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      })
      return {
        success: true,
        message: result.choices[0]?.message?.content || '',
        usage: result.usage,
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  if (modelId.startsWith('anthropic/')) {
    // BYOK Anthropic
    const apiKey = getApiKeyForModel(modelId)
    if (!apiKey) return { success: false, error: '❌ No Anthropic API key set.' }
    try {
      return await createAnthropicChatCompletion(messages, modelId, apiKey)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  if (modelId.startsWith('google/')) {
    // BYOK Gemini
    const apiKey = getApiKeyForModel(modelId)
    if (!apiKey) return { success: false, error: '❌ No Gemini API key set.' }
    try {
      return await createGeminiChatCompletion(messages, modelId, apiKey)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  if (modelId.startsWith('grok/')) {
    const apiKey = getApiKeyForModel(modelId)
    if (!apiKey) return { success: false, error: '❌ No Grok API key set.' }
    try {
      const result = await createGrokChatCompletion(messages, modelId, apiKey)
      return {
        success: true,
        message: result.message,
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  return { success: false, error: 'Unknown model provider.' }
}

export const createChatCompletionStream = async (messages: ChatMessage[], modelId: ModelsIds) => {
  // Only support streaming for OpenRouter/free models for now
  if (!modelId.endsWith(':free')) {
    return {
      success: false,
      error: 'Streaming is only supported for free models (OpenRouter) in this version.',
      stream: null,
    }
  }
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
