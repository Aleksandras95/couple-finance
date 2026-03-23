import { cookies } from 'next/headers'
import { verifyJWT, type SessionPayload } from './auth'

export const SESSION_COOKIE = 'cf_session'

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    return await verifyJWT(token)
  } catch {
    return null
  }
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}
