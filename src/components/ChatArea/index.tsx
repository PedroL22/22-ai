import { useEffect, useRef, useState, useTransition } from 'react'

import { ArrowUp } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { api } from '~/trpc/react'
import { Message } from './components/Message'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export const ChatArea = () => {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const [isPending, startTransition] = useTransition()

  const sendMessageMutation = api.chat.sendMessage.useMutation()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isPending && message === '') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isPending, message])

  const handleSendSupportText = async (text: string) => {
    if (!text || isPending) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    startTransition(async () => {
      setMessage('')

      try {
        const apiMessages = [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

        const response = await sendMessageMutation.mutateAsync({
          messages: apiMessages,
        })

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.message || 'Sorry, I could not generate a response.',
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    })
  }

  const handleSendMessage = () => {
    if (!message.trim() || isPending) return

    handleSendSupportText(message)
  }

  return (
    <div className='relative flex w-full flex-col items-center bg-accent px-6 md:px-20'>
      <div
        ref={chatContainerRef}
        className='scrollbar-hide w-full flex-1 space-y-3 overflow-y-auto overscroll-contain [&:not(*:is(@supports(-moz-appearance:none)))]:py-16 [@supports(-moz-appearance:none)]:py-22'
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={`${msg.role}-${msg.content}-${msg.timestamp.getTime()}-${index}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
              layout='position'
              className='flex flex-col'
            >
              <Message message={msg} />
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={messagesEndRef} className='h-1' />
      </div>

      <div className='-translate-x-1/2 absolute bottom-0 left-1/2 flex w-full max-w-[calc(100%-3rem)] gap-2 rounded-t-xl border-6 border-background/10 border-b-0 bg-border/80 pt-2 pr-2 pb-4 pl-1 backdrop-blur-sm md:max-w-[calc(100%-10rem)] '>
        <div className='relative flex w-full items-center space-x-2'>
          <Textarea
            id='chat-message-input'
            placeholder='Type your message here...'
            title='Type your message here...'
            disabled={isPending}
            value={message}
            className='scrollbar-hide min-h-9 resize-none whitespace-nowrap rounded-t-xl border-none bg-transparent text-sm shadow-none placeholder:select-none placeholder:text-sm focus-visible:ring-0 md:text-base md:placeholder:text-base dark:bg-transparent'
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  // Allow new line when Shift+Enter is pressed
                  return
                }

                e.preventDefault()
                handleSendMessage()
              }
            }}
          />

          <Button
            title='Send'
            variant='default'
            size='icon'
            disabled={!message.trim()}
            isLoading={isPending}
            onClick={handleSendMessage}
          >
            <ArrowUp />
          </Button>
        </div>
      </div>
    </div>
  )
}
