import { beforeEach, afterEach, expect, it, vi } from 'vitest'
beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})
afterEach(() => vi.restoreAllMocks())
it('keeps a usable memory session when storage is blocked', async () => {
  const session = await import('@/lib/session')
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  session.setSessionToken('memory')
  expect(session.sessionToken()).toBe('memory')
  expect(session.sessionIsPersistent()).toBe(false)
})
it('ignores expiration of a superseded token', async () => {
  const session = await import('@/lib/session')
  session.setSessionToken('first')
  session.setSessionToken('second')
  expect(session.expireSession('first')).toBe(false)
  expect(session.sessionToken()).toBe('second')
  expect(session.expireSession('second')).toBe(true)
  expect(session.sessionToken()).toBeNull()
})
it('reports cross-tab replacement, clear and unsubscribe exactly once', async () => {
  const session = await import('@/lib/session'),
    listener = vi.fn(),
    stop = session.onSessionChange(listener)
  session.acceptStorageChange({ key: 'other', newValue: 'ignored' })
  session.acceptStorageChange({ key: session.TOKEN_KEY, newValue: 'cross-tab' })
  expect(session.sessionToken()).toBe('cross-tab')
  session.acceptStorageChange({ key: null, newValue: null })
  expect(session.sessionToken()).toBeNull()
  expect(listener).toHaveBeenCalledTimes(2)
  stop()
  session.setSessionToken('last')
  expect(listener).toHaveBeenCalledTimes(2)
})

it('removes an old persisted account if replacing its token hits storage quota', async () => {
  const session = await import('@/lib/session')
  session.setSessionToken('old')
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('full')
  })
  session.setSessionToken('new')
  expect(session.sessionToken()).toBe('new')
  expect(localStorage.getItem(session.TOKEN_KEY)).toBeNull()
  expect(session.sessionIsPersistent()).toBe(false)
})
