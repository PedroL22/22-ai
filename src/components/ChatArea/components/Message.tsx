'use client'

import { cva } from 'class-variance-authority'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Bot, User } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'

import { formatMessageDateForChatHistory } from '~/lib/format-date-for-chat-history'

const messageVariants = cva('flex flex-col gap-1 rounded-2xl px-4 py-3 text-sm', {
  variants: {
    variant: {
      client: 'max-w-[70%] self-start bg-border dark:bg-chart-4',
      bot: 'max-w-[80%] self-start bg-teal-200 dark:bg-teal-900',
      support:
        'max-w-[70%] self-end bg-primary text-primary-foreground dark:bg-sidebar-foreground dark:text-foreground',
    },
  },
  defaultVariants: {
    variant: 'support',
  },
})

type MessageProps = {
  message: MessageType
}

export const Message = ({ message }: MessageProps) => {
  const iconToShow = () => {
    if (message.role === 'client') return <User className='size-4' />
    if (message.role === 'bot') return <Bot className='size-4' />
  }

  const tooltipMessage = () => {
    const messageDate = new Date(message.timestamp)

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

    const detailedDate = `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dateString} às ${timeString}`

    if (message.role === 'client') return `Mensagem sent by the client on ${detailedDate}`
    if (message.role === 'bot') return `Mensagem sent by the bot on ${detailedDate}`
  }

  return (
    <div className={messageVariants({ variant: message.role })}>
      <div
        data-has-image={!!message.mediaUrl && message.type === 'image'}
        className='max-w-none whitespace-pre-wrap break-words data-[has-image]:max-w-96'
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ node, ...props }) => <a {...props} target='_blank' rel='noopener noreferrer' />,
          }}
        >
          {message.message}
        </ReactMarkdown>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              data-role={message.role}
              className='flex cursor-pointer items-center space-x-2 self-end text-muted-foreground data-[role=support]:text-zinc-300'
            >
              <div className='text-xs'>{formatMessageDateForChatHistory(message.timestamp)}</div>

              {iconToShow()}
            </div>
          </TooltipTrigger>

          <TooltipContent>{tooltipMessage()}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
