type ChatItem = {
  id: string
  title: string | null
  updatedAt: Date | string
  isLocal?: boolean
}

type GroupedChats = {
  today: ChatItem[]
  last7Days: ChatItem[]
  last30Days: ChatItem[]
  older: ChatItem[]
}

export const groupChatsByTime = (chats: ChatItem[]): GroupedChats => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const grouped: GroupedChats = {
    today: [],
    last7Days: [],
    last30Days: [],
    older: [],
  }

  for (const chat of chats) {
    const chatDate = new Date(chat.updatedAt)

    if (chatDate >= today) {
      grouped.today.push(chat)
    } else if (chatDate >= last7Days) {
      grouped.last7Days.push(chat)
    } else if (chatDate >= last30Days) {
      grouped.last30Days.push(chat)
    } else {
      grouped.older.push(chat)
    }
  }

  // Sort each group by date (newest first)
  for (const group of Object.values(grouped)) {
    group.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime()
      const dateB = new Date(b.updatedAt).getTime()
      return dateB - dateA
    })
  }

  return grouped
}

export const getGroupLabel = (groupKey: keyof GroupedChats): string => {
  const labels = {
    today: 'Today',
    last7Days: 'Last 7 days',
    last30Days: 'Last 30 days',
    older: 'Older',
  }
  return labels[groupKey]
}
