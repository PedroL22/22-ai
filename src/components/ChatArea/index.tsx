'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { EmptyState } from './components/EmptyState'
import { Message } from './components/Message'

import { useChatStore } from '~/stores/useChatStore'
import { api } from '~/trpc/react'

import { env } from '~/env'
import { createStreamingChatCompletion } from '~/lib/streaming'
import { useRealtimeSync } from '~/lib/useRealtimeSync'

import type { Message as MessageType } from '@prisma/client'
import type { ModelsIds } from '~/types/models'

type ChatAreaProps = {
  chatId?: string
}

export const ChatArea = ({ chatId }: ChatAreaProps) => {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<MessageType[]>([])
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [userScrolledUp, setUserScrolledUp] = useState(false)
  const {
    addChat,
    setCurrentChatId,
    chats,
    addMessage,
    getMessages,
    streamingMessage,
    isStreaming,
    setStreamingMessage,
    setIsStreaming,
    renameChat,
  } = useChatStore()

  const generateTitleMutation = api.chat.generateChatTitle.useMutation()
  const { syncChat, syncMessage } = useRealtimeSync()

  const router = useRouter()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Load messages when chatId changes or component mounts
  useEffect(() => {
    if (chatId) {
      const storedMessages = getMessages(chatId)
      setMessages(storedMessages)
    } else {
      setMessages([])
    }
  }, [chatId, getMessages])

  // Sync local state with store when messages change
  useEffect(() => {
    if (chatId) {
      const storedMessages = getMessages(chatId)
      setMessages(storedMessages)
    }
  }, [chats, chatId, getMessages])

  useEffect(() => {
    if (!isStreaming && message === '' && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isStreaming, message, messages, streamingMessage])

  // Auto-scroll during streaming if user is at bottom and hasn't manually scrolled up
  useEffect(() => {
    if (isStreaming && isAtBottom && !userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isStreaming, streamingMessage, isAtBottom, userScrolledUp])

  // Scroll detection
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const threshold = 100 // Show button when 100px away from bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight < threshold

      setIsAtBottom(isNearBottom)
      setShowScrollToBottom(messages.length > 0 && !isNearBottom)

      // Track if user manually scrolled up during streaming
      if (isStreaming && !isNearBottom) {
        setUserScrolledUp(true)
      } else if (isNearBottom) {
        setUserScrolledUp(false)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [messages.length, isStreaming])

  const handleSuggestionClick = (suggestion: string) => {
    if (isStreaming) return
    setMessage(suggestion)
  }
  const handleSendMessage = async () => {
    if (!message.trim() || isStreaming) return

    const userMessage = message.trim()
    setMessage('')
    setUserScrolledUp(false) // Reset scroll tracking when sending new message

    try {
      let currentChatId = chatId

      if (!currentChatId) {
        currentChatId = uuid()

        // Navigate to the new chat immediately
        router.push(`/${currentChatId}`)

        // Create chat locally in store with empty title initially
        const newChat = {
          id: currentChatId,
          title: '', // Empty string initially, will be updated by title generation
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: '', // Will be set when saved to DB
        }

        // Add chat to store immediately
        addChat(newChat)
        setCurrentChatId(currentChatId) // Sync the new chat to database immediately
        syncChat(newChat)

        // Generate title concurrently using tRPC
        generateTitleMutation
          .mutateAsync({ firstMessage: userMessage })
          .then((result) => {
            const newTitle = result.success && result.title ? result.title : 'New chat'
            renameChat(currentChatId!, newTitle)

            // Sync the updated chat with the new title
            const updatedChat = {
              id: currentChatId!,
              title: newTitle,
              createdAt: newChat.createdAt,
              updatedAt: new Date(),
              userId: '',
            }
            syncChat(updatedChat)
          })
          .catch((error) => {
            console.error('❌ Failed to generate title: ', error)
            renameChat(currentChatId!, 'New chat')

            // Sync the chat with fallback title
            const updatedChat = {
              id: currentChatId!,
              title: 'New chat',
              createdAt: newChat.createdAt,
              updatedAt: new Date(),
              userId: '',
            }
            syncChat(updatedChat)
          })
      }

      // Add user message to UI immediately
      const tempUserMessage: MessageType = {
        id: uuid(),
        role: 'user',
        content: userMessage,
        createdAt: new Date(),
        userId: '',
        chatId: currentChatId,
        modelId: null,
      }

      setMessages((prev) => [...prev, tempUserMessage])
      addMessage(currentChatId, tempUserMessage)

      // Sync the user message to database
      syncMessage(tempUserMessage)

      // Update and sync chat timestamp after adding message
      const currentChat = chats.find((chat) => chat.id === currentChatId)
      if (currentChat) {
        const updatedChat = {
          ...currentChat,
          updatedAt: new Date(),
        }
        syncChat(updatedChat)
      }

      // Get all messages for context

      const allMessages = [...messages, tempUserMessage].map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      setIsStreaming(true)
      setStreamingMessage('')

      await createStreamingChatCompletion(
        allMessages,
        env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL as ModelsIds,
        (chunk) => {
          if (chunk.type === 'chunk' && chunk.content) {
            setStreamingMessage((prev) => {
              const newMessage = prev + chunk.content
              return newMessage
            })
          }
        },
        async (fullMessage) => {
          const assistantMessage: MessageType = {
            id: uuid(),
            role: 'assistant',
            content: fullMessage,
            createdAt: new Date(),
            userId: '',
            chatId: currentChatId!,
            modelId: env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL as ModelsIds,
          } // Add to store first
          addMessage(currentChatId!, assistantMessage)

          // Sync the assistant message to database
          syncMessage(assistantMessage)

          // Update and sync chat timestamp after adding assistant message
          const currentChat = chats.find((chat) => chat.id === currentChatId)
          if (currentChat) {
            const updatedChat = {
              ...currentChat,
              updatedAt: new Date(),
            }
            syncChat(updatedChat)
          }

          // Then update local state from store to ensure consistency
          setMessages(getMessages(currentChatId!))

          setStreamingMessage('')
          setIsStreaming(false)
        },
        (error) => {
          console.error('❌ Streaming error: ', error)
          setStreamingMessage('')
          setIsStreaming(false)
        }
      )
    } catch (err) {
      console.error('❌ Error sending message: ', err)
    }
  }
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollToBottom(false)
    setUserScrolledUp(false) // Reset scroll tracking when manually scrolling to bottom
  }

  return (
    <div className='relative flex w-full flex-col items-center bg-accent px-6 md:px-20'>
      <div
        ref={chatContainerRef}
        className='scrollbar-hide w-full flex-1 space-y-3 overflow-y-auto overscroll-contain [&:not(*:is(@supports(-moz-appearance:none)))]:py-16 [@supports(-moz-appearance:none)]:py-22'
      >
        {messages.length === 0 && !isStreaming ? (
          <div className='flex items-center justify-center pb-4 md:h-full md:pb-0'>
            <EmptyState onSuggestionClickAction={handleSuggestionClick} />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={`${msg.role}-${msg.content}-${new Date(msg.createdAt).getTime()}-${index}`}
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

            {isStreaming && streamingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                layout='position'
                className='flex flex-col'
              >
                <Message
                  message={{
                    role: 'assistant',
                    content: streamingMessage,
                    createdAt: new Date(),
                    userId: '',
                    chatId: chatId || '',
                    modelId: env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL as ModelsIds,
                  }}
                />
              </motion.div>
            )}

            {isStreaming && !streamingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                layout='position'
                className='flex flex-col'
              >
                <div className='animate-pulse p-4 text-muted-foreground text-sm'>Assistant is thinking...</div>
              </motion.div>
            )}
          </AnimatePresence>
        )}{' '}
        <div ref={messagesEndRef} className='h-1' />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollToBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className='absolute right-4 bottom-20 z-10 md:right-8 md:bottom-24'
          >
            <Button
              onClick={scrollToBottom}
              variant='secondary'
              size='icon'
              className='rounded-full border border-border/50 bg-background/80 shadow-lg backdrop-blur-sm hover:bg-background/90'
              title='Scroll to bottom'
            >
              <ArrowDown className='size-4' />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className='-translate-x-1/2 absolute bottom-0 left-1/2 flex w-full max-w-[calc(100%-3rem)] gap-2 rounded-t-xl border-6 border-background/10 border-b-0 bg-border/80 pt-2 pr-2 pb-4 pl-1 backdrop-blur-sm md:max-w-[calc(100%-10rem)] dark:bg-zinc-700/80'>
        <div className='relative flex w-full items-center space-x-2'>
          <Textarea
            id='chat-message-input'
            placeholder='Type your message here...'
            title='Type your message here...'
            disabled={isStreaming}
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
            disabled={isStreaming || !message.trim()}
            isLoading={isStreaming}
            onClick={handleSendMessage}
          >
            <ArrowUp />
          </Button>
        </div>
      </div>
    </div>
  )
}
