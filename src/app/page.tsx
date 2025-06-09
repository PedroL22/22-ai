import { ChatArea } from '~/components/ChatArea'
import { Sidebar } from '~/components/Sidebar'

export default async function Home() {
  return (
    <div className='flex h-svh w-screen items-center justify-center overflow-hidden 2xl:py-5'>
      <div className='flex size-full max-w-[1500px] bg-accent 2xl:overflow-hidden 2xl:rounded-lg 2xl:shadow-sm dark:bg-accent'>
        <Sidebar />

        <ChatArea />
      </div>
    </div>
  )
}
