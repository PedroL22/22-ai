/**
 * Formats a date in a WhatsApp-like style for the chat list.
 * @param timestamp - ISO timestamp string
 * @returns Formatted string (e.g., "14:30", "Yesterday", "15/03/2024")
 */
export const formatMessageDateForChatList = (timestamp: string): string => {
  const messageDate = new Date(timestamp)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  // Format time in 24h format
  const timeString = messageDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  // If it's today, show only the time
  if (messageDate.toDateString() === now.toDateString()) {
    return timeString
  }

  // If it's yesterday, show "Yesterday"
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  // If it's from this year, show day/month
  if (messageDate.getFullYear() === now.getFullYear()) {
    const dateString = messageDate.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
    })
    return dateString
  }

  // If it's from another year, show complete date
  const dateString = messageDate.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return dateString
}
