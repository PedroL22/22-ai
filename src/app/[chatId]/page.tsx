import { ChatArea } from '~/components/ChatArea'

type PageProps = {
  params: Promise<{ chatId: string }>
}

export default async function ChatPage({ params }: PageProps) {
  const { chatId } = await params

  return <ChatArea chatId={chatId} />
}
