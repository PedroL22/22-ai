declare module 'next-pwa' {
  import type { NextConfig } from 'next'

  interface PWAConfig {
    dest?: string
    disable?: boolean
    register?: boolean
    skipWaiting?: boolean
    fallbacks?: {
      document?: string
      image?: string
      audio?: string
      video?: string
      font?: string
    }
    buildExcludes?: RegExp[]
    runtimeCaching?: Array<{
      urlPattern: RegExp | string | ((context: { request: Request; url: URL }) => boolean)
      handler: string
      options?: {
        cacheName?: string
        expiration?: {
          maxEntries?: number
          maxAgeSeconds?: number
        }
        cacheableResponse?: {
          statuses?: number[]
        }
        rangeRequests?: boolean
        networkTimeoutSeconds?: number
      }
    }>
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig
  export default withPWA
}
