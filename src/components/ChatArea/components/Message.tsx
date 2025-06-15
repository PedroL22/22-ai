'use client'

import { cva } from 'class-variance-authority'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Bot, User } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'

import { formatMessageDateForChatHistory } from '~/utils/format-date-for-chat-history'

import type { Message as MessageType } from '@prisma/client'
import type { ModelsIds, ModelsNames } from '~/types/models'

const messageVariants = cva('flex flex-col gap-1 rounded-2xl px-4 py-3 text-sm', {
  variants: {
    variant: {
      user: 'max-w-[70%] self-end bg-primary text-primary-foreground',
      assistant: 'max-w-[80%] self-start bg-border/80 dark:bg-zinc-700/80',
    },
  },
  defaultVariants: {
    variant: 'user',
  },
})

type MessageProps = {
  message: Omit<MessageType, 'id'>
}

export const Message = ({ message }: MessageProps) => {
  const iconToShow = () => {
    if (message.role === 'user') return <User className='size-4' />
    if (message.role === 'assistant') return <Bot className='size-4' />
  }

  const getModelName = (modelId: ModelsIds): ModelsNames => {
    const modelNames: Record<ModelsIds, ModelsNames> = {
      'google/gemini-2.0-flash-exp:free': 'Gemini 2.0 Flash Experimental',
      'google/gemma-3-27b-it:free': 'Gemma 3 27B',
      'deepseek/deepseek-chat-v3-0324:free': 'DeepSeek V3 0324',
      'deepseek/deepseek-r1-0528:free': 'R1 0528',
      'tngtech/deepseek-r1t-chimera:free': 'DeepSeek R1T Chimera',
      'mistralai/devstral-small:free': 'Devstral Small',
    }

    return modelNames[modelId] || modelId
  }

  const tooltipMessage = () => {
    const messageDate = message.createdAt

    const weekday = messageDate.toLocaleDateString('en-US', { weekday: 'long' })
    const dateString = messageDate.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const timeString = messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    const detailedDate = `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dateString} at ${timeString}`

    if (message.role === 'user') return `Message sent by you on ${detailedDate}`
    if (message.role === 'assistant') {
      return `Message sent by ${getModelName(message.modelId as ModelsIds)} on ${detailedDate}`
    }
  }

  return (
    <div className={messageVariants({ variant: message.role })}>
      <div className='max-w-none whitespace-pre-wrap break-words'>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ node, ...props }) => <a {...props} target='_blank' rel='noopener noreferrer' />,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              data-role={message.role}
              className='flex cursor-pointer items-center space-x-2 self-end text-muted-foreground data-[role=user]:text-zinc-300'
            >
              <div className='text-xs'>{formatMessageDateForChatHistory(message.createdAt.toISOString())}</div>

              {iconToShow()}
            </div>
          </TooltipTrigger>

          <TooltipContent>{tooltipMessage()}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
