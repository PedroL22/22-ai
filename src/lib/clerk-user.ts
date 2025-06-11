/**
 * Utility functions for working with Clerk user emails
 */

import type { User } from '@clerk/nextjs/server'

/**
 * Gets the primary email address from a Clerk user object.
 * Falls back to the first email if no primary email is set.
 *
 * @param user - The Clerk user object
 * @returns The user's email address or empty string if none found
 */
export function getUserEmail(user: User | null | undefined): string {
  if (!user) return ''

  return user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || ''
}

/**
 * Gets all email addresses for a user with their status
 *
 * @param user - The Clerk user object
 * @returns Array of email objects with metadata
 */
export function getAllUserEmails(user: User | null | undefined): Array<{
  id: string
  email: string
  verified: boolean
  primary: boolean
}> {
  if (!user?.emailAddresses) return []

  return user.emailAddresses.map((email) => ({
    id: email.id,
    email: email.emailAddress,
    verified: email.verification?.status === 'verified',
    primary: email.id === user.primaryEmailAddressId,
  }))
}

/**
 * Gets the primary verified email address, falling back to any verified email
 *
 * @param user - The Clerk user object
 * @returns The user's verified email address or empty string if none found
 */
export function getVerifiedUserEmail(user: User | null | undefined): string {
  if (!user?.emailAddresses) return ''

  const primaryEmail = user.primaryEmailAddress
  if (primaryEmail?.verification?.status === 'verified') {
    return primaryEmail.emailAddress
  }

  const verifiedEmail = user.emailAddresses.find((email) => email.verification?.status === 'verified')

  return verifiedEmail?.emailAddress || getUserEmail(user)
}

/**
 * Type guard to check if user has a valid email
 *
 * @param user - The Clerk user object
 * @returns Boolean indicating if user has an email
 */
export function userHasEmail(user: User | null | undefined): user is User {
  return Boolean(user && getUserEmail(user))
}
