import { readStorage, writeStorage } from './storage'
export const TOKEN_KEY = 'bicoma_token'
export interface SessionChange {
  token: string | null
  previous: string | null
  source: 'local' | 'storage'
}
let token = readStorage(TOKEN_KEY)
let persisted = true
let epoch = 0
const listeners = new Set<(change: SessionChange) => void>()
export const sessionToken = () => token
export const sessionEpoch = () => epoch
export const sessionIsPersistent = () => persisted
function change(next: string | null, source: SessionChange['source']) {
  const previous = token
  token = next
  if (previous === next) return
  epoch++
  for (const listener of listeners) listener({ token: next, previous, source })
}
export function setSessionToken(next: string | null) {
  persisted = writeStorage(TOKEN_KEY, next)
  if (!persisted && next !== null) writeStorage(TOKEN_KEY, null)
  change(next, 'local')
}
export function expireSession(expected: string | null): boolean {
  if (!expected || token !== expected) return false
  setSessionToken(null)
  return true
}
export function onSessionChange(listener: (change: SessionChange) => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export function acceptStorageChange(event: Pick<StorageEvent, 'key' | 'newValue'>) {
  if (event.key === TOKEN_KEY || event.key === null) {
    persisted = true
    change(event.key === null ? null : event.newValue, 'storage')
  }
}
