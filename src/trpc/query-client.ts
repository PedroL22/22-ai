import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query'
import SuperJSON from 'superjson'

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60000, // 60 seconds
        retry: 2, // Retry failed queries up to 2 times
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  })
