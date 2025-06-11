'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { v4 as uuid } from 'uuid'

import { ArrowUp } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { Message } from './components/Message'

import { useChatStore } from '~/stores/useChatStore'

import { api } from '~/trpc/react'

import type { Message as MessageType } from '@prisma/client'
import type { LocalMessage } from '~/types/local-data'

type ChatAreaProps = {
  chatId?: string
}

export const ChatArea = ({ chatId }: ChatAreaProps) => {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<LocalMessage[]>([])

  const [isPending, startTransition] = useTransition()
  const { isSignedIn } = useUser()
  const router = useRouter()
  const utils = api.useUtils()

  const sendMessageMutation = api.chat.sendMessage.useMutation()
  const sendMessageToChatMutation = api.chat.sendMessageToChat.useMutation()
  const createChatWithAutoTitleMutation = api.chat.createChatWithAutoTitle.useMutation()
  const generateTitleMutation = api.chat.generateChatTitle.useMutation()
  const getChatMessagesQuery = api.chat.getChatMessages.useQuery(
    { chatId: chatId! },
    { enabled: !!chatId && isSignedIn }
  )

  const {
    createLocalChatWithMessage,
    addLocalMessage,
    updateLocalChatTitle,
    setActiveChat,
    getCurrentChat,
    chatExists,
  } = useChatStore()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isPending && message === '') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isPending, message])

  // Check if the chat exists and redirect if not
  useEffect(() => {
    if (chatId) {
      const exists = chatExists(chatId, !!isSignedIn)
      if (!exists) {
        router.push('/')
        return
      }
    }
  }, [chatId, chatExists, isSignedIn, router])

  // Load existing chat messages if chatId is provided
  useEffect(() => {
    if (chatId) {
      setActiveChat(chatId)

      if (isSignedIn) {
        // For authenticated users, messages will be loaded via the query
        // We'll handle this in a separate useEffect
      } else {
        // For anonymous users, load messages from local storage immediately
        const currentChat = getCurrentChat()
        if (currentChat && 'messages' in currentChat) {
          const localMessages: LocalMessage[] = currentChat.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            modelId: msg.modelId,
            createdAt: new Date(msg.createdAt),
            userId: msg.userId,
            chatId: msg.chatId,
          }))
          setMessages(localMessages)
        } else {
          setMessages([])
        }
      }
    } else {
      // Clear messages when no chat is selected
      setMessages([])
    }
  }, [chatId, setActiveChat, getCurrentChat, isSignedIn])

  // Load database messages when query data is available
  useEffect(() => {
    if (isSignedIn && getChatMessagesQuery.data && chatId) {
      const dbMessages: MessageType[] = getChatMessagesQuery.data.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        modelId: msg.modelId,
        createdAt: new Date(msg.createdAt),
        userId: msg.userId,
        chatId: msg.chatId,
      }))
      setMessages(dbMessages)
    }
  }, [getChatMessagesQuery.data, isSignedIn, chatId])

  const createNewChatAndSendMessage = async (text: string) => {
    startTransition(async () => {
      setMessage('')

      if (isSignedIn) {
        // For authenticated users, create database chat with auto-generated title
        try {
          const result = await createChatWithAutoTitleMutation.mutateAsync({
            firstMessage: text,
          })

          if (result.success) {
            // Navigate to the new chat
            router.push(`/${result.chatId}`)

            // Update local state
            const userMessage: LocalMessage = {
              id: uuid(),
              modelId: null,
              role: 'user',
              content: text,
              createdAt: new Date(),
            }

            const assistantMessage: LocalMessage = {
              id: uuid(),
              modelId: result.model,
              role: 'assistant',
              content: result.message,
              createdAt: new Date(),
            }

            setMessages([userMessage, assistantMessage])
          }
        } catch (error) {
          console.error('Failed to create chat:', error)
        }
      } else {
        // For anonymous users, create local chat
        try {
          // Generate title for local chat
          const titleResult = await generateTitleMutation.mutateAsync({
            message: text,
          })

          const newChat = createLocalChatWithMessage(text, null, titleResult.title)

          // Get AI response for local chat
          const response = await sendMessageMutation.mutateAsync({
            messages: [{ role: 'user', content: text }],
          })

          // Add AI response to local chat
          addLocalMessage(newChat.id, 'assistant', response.message || 'No response generated.', response.model)

          // Navigate to the new chat
          router.push(`/${newChat.id}`)

          // Update local state
          const userMessage: LocalMessage = {
            id: uuid(),
            role: 'user',
            modelId: null,
            content: text,
            createdAt: new Date(),
          }

          const assistantMessage: LocalMessage = {
            id: uuid(),
            role: 'assistant',
            modelId: response.model,
            content: response.message || 'No response generated',
            createdAt: new Date(),
          }

          setMessages([userMessage, assistantMessage])
        } catch (error) {
          console.error('Failed to create local chat:', error)
        }
      }
    })
  }

  const handleSendSupportText = async (text: string) => {
    if (!text || isPending) return

    if (!chatId) {
      // No active chat, create a new one
      await createNewChatAndSendMessage(text)
      return
    }

    // Existing chat logic
    const userMessage: LocalMessage = {
      id: uuid(),
      role: 'user',
      content: text,
      modelId: null,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    startTransition(async () => {
      setMessage('')

      try {
        if (isSignedIn) {
          // For authenticated users, send to database chat
          const response = await sendMessageToChatMutation.mutateAsync({
            chatId: chatId!,
            message: text,
          })

          const assistantMessage: LocalMessage = {
            id: uuid(),
            role: 'assistant',
            content: response.message || 'Sorry, I could not generate a response.',
            modelId: null,
            createdAt: new Date(),
          }

          setMessages((prev) => [...prev, assistantMessage])

          // Invalidate the messages query to refetch from database
          await utils.chat.getChatMessages.invalidate({ chatId: chatId! })
          // Also invalidate the user chats to update the last message createdAt
          await utils.chat.getUserChats.invalidate()
        } else {
          // For anonymous users, use the general sendMessage API and save locally
          const apiMessages = [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))

          const response = await sendMessageMutation.mutateAsync({
            messages: apiMessages,
          })

          const assistantMessage: LocalMessage = {
            id: uuid(),
            role: 'assistant',
            content: response.message || 'Sorry, I could not generate a response.',
            modelId: response.model,
            createdAt: new Date(),
          }

          setMessages((prev) => [...prev, assistantMessage])

          // Save to local chat
          if (chatId) {
            addLocalMessage(chatId, 'user', text)
            addLocalMessage(chatId, 'assistant', response.message || 'No response generated', response.model)
          }
        }
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
              key={`${msg.role}-${msg.content}-${msg.createdAt.getTime()}-${index}`}
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

        {/* Loading indicator for database messages */}
        {isSignedIn && chatId && getChatMessagesQuery.isLoading && messages.length === 0 && (
          <div className='flex items-center justify-center py-8'>
            <div className='text-muted-foreground'>Loading messages...</div>
          </div>
        )}

        {/* Error indicator for database messages */}
        {isSignedIn && chatId && getChatMessagesQuery.error && messages.length === 0 && (
          <div className='flex items-center justify-center py-8'>
            <div className='text-destructive'>Failed to load messages. Please try again.</div>
          </div>
        )}

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
