import type { ChatMessage } from '~/lib/openai'
import { useApiKeyStore } from '~/stores/useApiKeyStore'
import type { ModelsIds } from '~/types/models'

export type StreamResponse = {
  type: 'chunk' | 'done' | 'error'
  content?: string
  fullMessage?: string
  error?: string
  done: boolean
}

export async function* streamChatCompletion(
  messages: ChatMessage[],
  modelId: ModelsIds
): AsyncGenerator<StreamResponse, void, unknown> {
  try {
    const { openaiApiKey, anthropicApiKey, geminiApiKey, grokApiKey } = useApiKeyStore.getState()

    let apiKey: string | undefined

    if (modelId.startsWith('openai/')) apiKey = openaiApiKey
    else if (modelId.startsWith('anthropic/')) apiKey = anthropicApiKey
    else if (modelId.startsWith('google/')) apiKey = geminiApiKey
    else if (modelId.startsWith('grok/')) apiKey = grokApiKey

    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        modelId,
        apiKey,
      }),
    })

    if (!response.ok) {
      // Attempt to surface the actual error returned by the server
      let errorMsg = `HTTP error ${response.status}`
      const contentType = response.headers.get('content-type') || ''
      try {
        if (contentType.includes('application/json')) {
          const json = await response.json()
          errorMsg = (json.error as string) || JSON.stringify(json)
        } else {
          errorMsg = await response.text()
        }
      } catch {
        // ignore parse errors
      }
      throw new Error(errorMsg)
    }

    if (!response.body) {
      throw new Error('No response body.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as StreamResponse
              yield data

              if (data.done) {
                return
              }
            } catch (parseError) {
              console.warn('⚠️ Failed to parse SSE data: ', parseError)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  } catch (err) {
    console.error('❌ Error in streamChatCompletion: ', err)

    yield {
      type: 'error',
      error: err instanceof Error ? err.message : 'Unknown error occurred.',
      done: true,
    }
  }
}

export async function createStreamingChatCompletion(
  messages: ChatMessage[],
  modelId: ModelsIds,
  onChunk: (chunk: StreamResponse) => void,
  onComplete: (fullMessage: string) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    for await (const chunk of streamChatCompletion(messages, modelId)) {
      onChunk(chunk)

      if (chunk.type === 'done' && chunk.fullMessage) {
        onComplete(chunk.fullMessage)
        return
      }

      if (chunk.type === 'error') {
        onError(chunk.error || 'Unknown error occurred.')
        return
      }
    }
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Unknown error occurred.')
  }
}
