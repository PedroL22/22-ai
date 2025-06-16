import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { env } from '~/env'
import { createChatCompletionStream } from '~/lib/openai'
import { tryCatch } from '~/utils/try-catch'

import type { ModelsIds } from '~/types/models'
import { MODELS } from '~/types/models'

const MODEL_IDS = MODELS.map((model) => model.id) as [ModelsIds, ...ModelsIds[]]

const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
})

const streamRequestSchema = z.object({
  messages: z.array(chatMessageSchema),
  modelId: z
    .enum(MODEL_IDS)
    .optional()
    .default(env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL as ModelsIds),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, modelId } = streamRequestSchema.parse(body)

    const { data, error } = await tryCatch(createChatCompletionStream(messages, modelId))

    if (error) {
      console.error('❌ Error creating chat completion stream: ', error)
      return NextResponse.json({ error: 'Failed to create streaming response' }, { status: 500 })
    }

    if (!data.stream) {
      return NextResponse.json({ error: 'No stream data available' }, { status: 500 })
    }

    // Create a ReadableStream for Server-Sent Events
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullMessage = ''

          for await (const chunk of data.stream) {
            const content = chunk.choices[0]?.delta?.content || ''

            if (content) {
              fullMessage += content

              // Send the chunk as Server-Sent Event
              const sseData = JSON.stringify({
                type: 'chunk',
                content,
                fullMessage,
                done: false,
              })

              controller.enqueue(encoder.encode(`data: ${sseData}\n\n`))
            }
          }

          // Send the final message
          const finalData = JSON.stringify({
            type: 'done',
            content: '',
            fullMessage: fullMessage.trim().replace(/"/g, ''),
            done: true,
          })

          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
          controller.close()
        } catch (streamError) {
          console.error('❌ Error processing stream: ', streamError)

          const errorData = JSON.stringify({
            type: 'error',
            error: 'Error processing streaming response',
            done: true,
          })

          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (parseError) {
    console.error('❌ Error parsing request: ', parseError)
    return NextResponse.json({ error: 'Invalid request format' }, { status: 400 })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
