import { db } from '~/server/db'
import { useChatStore } from '~/stores/useChatStore'

/**
 * Ensures a user exists in the database. Creates them if they don't exist.
 * This is useful for lazy loading users when they first interact with features that require DB storage.
 */
export async function ensureUserExists(userId: string, userEmail: string) {
  const existingUser = await db.user.findFirst({
    where: { id: userId },
  })

  if (!existingUser) {
    return await db.user.create({
      data: {
        id: userId,
        email: userEmail,
      },
    })
  }

  return existingUser
}

/**
 * Creates a new user in the database.
 * Used by webhooks or when manually syncing users.
 */
export async function createUser(userId: string, userEmail: string) {
  return await db.user.create({
    data: {
      id: userId,
      email: userEmail,
    },
  })
}

/**
 * Deletes a user and all their related data.
 * Used when a user deletes their Clerk account.
 */
export async function deleteUser(userId: string) {
  return await db.user.delete({
    where: { id: userId },
  })
}

/**
 * Syncs local chats from localStorage to the database when user logs in.
 * This preserves any chats created while the user was anonymous.
 */
export async function syncLocalChatsToDatabase(
  userId: string,
  userEmail: string
): Promise<{
  synced: number
  errors: string[]
  chatIdMapping: Record<string, string> // old local ID -> new database ID
}> {
  await ensureUserExists(userId, userEmail)

  const localChats = useChatStore.getState().localChats
  let syncedCount = 0
  const errors: string[] = []
  const chatIdMapping: Record<string, string> = {}

  for (const localChat of localChats) {
    try {
      const dbChat = await db.chat.create({
        data: {
          title: localChat.title || `Chat ${new Date(localChat.createdAt).toLocaleDateString()}`,
          userId,
          createdAt: new Date(localChat.createdAt),
          updatedAt: new Date(localChat.updatedAt),
        },
      })

      chatIdMapping[localChat.id] = dbChat.id

      if (localChat.messages.length > 0) {
        await db.message.createMany({
          data: localChat.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            modelId: msg.modelId,
            userId,
            chatId: dbChat.id,
            createdAt: new Date(msg.createdAt),
          })),
        })
      }

      syncedCount++
    } catch (error) {
      console.error(`Failed to sync chat ${localChat.id}:`, error)
      errors.push(
        `Failed to sync chat "${localChat.title || 'Untitled'}": ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  return {
    synced: syncedCount,
    errors,
    chatIdMapping,
  }
}

/**
 * Clears local chats after successful sync.
 * Call this after confirming the sync was successful.
 */
export function clearLocalChatsAfterSync() {
  useChatStore.getState().clearLocalChats()
}
