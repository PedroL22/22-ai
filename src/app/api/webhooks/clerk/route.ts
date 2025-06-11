import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'

import { env } from '~/env'
import { createUser, deleteUser } from '~/lib/user-sync'

const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET

export async function POST(req: Request) {
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: any

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occurred', {
      status: 400,
    })
  }

  const eventType = evt.type
  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data
    const primaryEmail =
      email_addresses?.find((email: any) => email.id === evt.data.primary_email_address_id)?.email_address || ''

    try {
      await createUser(id, primaryEmail)
      console.log(`Created user ${id} in database`)
    } catch (error) {
      console.error(`Error creating user ${id}:`, error)
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      await deleteUser(id)
      console.log(`Deleted user ${id} from database`)
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error)
    }
  }

  return NextResponse.json({ received: true })
}
