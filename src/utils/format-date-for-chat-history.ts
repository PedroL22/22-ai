/**
 * Formats a date in a WhatsApp-like style for message history.
 * @param timestamp - ISO timestamp string
 * @returns Formatted string (e.g., "Today at 14:30", "Yesterday at 15:45", "Monday, 15/03 at 10:30")
 */
export const formatMessageDateForChatHistory = (timestamp: string): string => {
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

  // If it's today, show "Today at HH:mm"
  if (messageDate.toDateString() === now.toDateString()) {
    return `Today at ${timeString}`
  }

  // If it's yesterday, show "Yesterday at HH:mm"
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${timeString}`
  }

  // If it's from this year, show weekday, day/month and time
  if (messageDate.getFullYear() === now.getFullYear()) {
    const weekday = messageDate.toLocaleDateString('en-US', { weekday: 'long' })
    const dateString = messageDate.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
    })
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dateString} at ${timeString}`
  }

  // If it's from another year, show complete date with weekday
  const weekday = messageDate.toLocaleDateString('en-US', { weekday: 'long' })
  const dateString = messageDate.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dateString} at ${timeString}`
}
