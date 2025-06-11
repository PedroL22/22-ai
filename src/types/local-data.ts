export type LocalChat = {
  id: string
  title?: string
  isLocal: true
  createdAt: Date
  updatedAt: Date
  messages: LocalMessage[]
}

export type LocalMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  modelId: string | null
  createdAt: Date
  userId?: string
  chatId?: string
}
