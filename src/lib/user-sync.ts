import { db } from '~/server/db'

/**
 * Creates a new user in the database.
 * Used by webhooks or when manually syncing users.
 */
export const createUser = async (userId: string, userEmail: string) => {
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
export const deleteUser = async (userId: string) => {
  return await db.user.delete({
    where: { id: userId },
  })
}
