export default function OfflinePage() {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='space-y-4 text-center'>
        <h1 className='font-bold text-2xl text-foreground'>You're offline</h1>
        <p className='text-muted-foreground'>Please check your internet connection and try again.</p>
        <a
          href='/'
          className='inline-block rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90'
        >
          Go Home
        </a>
      </div>
    </div>
  )
}
