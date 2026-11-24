import { beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'
import { sessionToken, setSessionToken } from '@/lib/session'
import { deferred } from './fixtures'
vi.mock('@/lib/api', async () => {
  const session = await import('@/lib/session')
  return {
    api: { get: vi.fn(), post: vi.fn() },
    getStoredToken: session.sessionToken,
    setToken: session.setSessionToken,
  }
})
beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(api.get).mockReset()
  vi.mocked(api.post).mockReset()
  setSessionToken(null)
})
it('keeps the token after a temporary profile error and allows retry', async () => {
  const store = useAuthStore()
  setSessionToken('valid')
  vi.mocked(api.get)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ data: { user: { id: 1, name: 'A', email: 'a@test' } } })
  await store.fetchMe()
  expect(sessionToken()).toBe('valid')
  expect(store.error).toBe('offline')
  expect(store.ready).toBe(true)
  await store.fetchMe()
  expect(store.user?.id).toBe(1)
  expect(store.error).toBeNull()
})
it('never assigns a profile from an older token', async () => {
  const store = useAuthStore(),
    request = deferred<{ data: unknown }>()
  setSessionToken('old')
  vi.mocked(api.get).mockReturnValue(request.promise)
  const pending = store.fetchMe()
  setSessionToken('new')
  request.resolve({ data: { user: { id: 1, name: 'Old', email: 'old@test' } } })
  await pending
  expect(store.user).toBeNull()
})
it('a late logout does not discard a new account', async () => {
  const store = useAuthStore(),
    request = deferred<void>()
  setSessionToken('old')
  vi.mocked(api.post).mockReturnValue(request.promise)
  const pending = store.logout()
  setSessionToken('new')
  request.resolve()
  await pending
  expect(sessionToken()).toBe('new')
})
