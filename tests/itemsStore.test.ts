import { beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useItemsStore } from '@/stores/items'
import { api } from '@/lib/api'
import { setSessionToken } from '@/lib/session'
import { item, page, deferred } from './fixtures'
vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(api.get).mockReset()
  setSessionToken(null)
})
it('ignores a late older result even if the adapter ignores abort', async () => {
  const store = useItemsStore(),
    a = deferred<{ data: unknown }>(),
    b = deferred<{ data: unknown }>()
  vi.mocked(api.get).mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise)
  const first = store.fetch({ q: 'old' }),
    second = store.fetch({ q: 'new' })
  b.resolve({ data: page([item(2, 'New')]) })
  await second
  a.resolve({ data: page([item(1, 'Old')]) })
  await first
  expect(store.items.map((x) => x.title)).toEqual(['New'])
  expect(store.loading).toBe(false)
})
it('clears loading on errors and exposes retry instead of a false empty collection', async () => {
  const store = useItemsStore()
  vi.mocked(api.get)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ data: page([item()]) })
  expect(await store.fetch()).toBe(false)
  expect(store.error).toBe('offline')
  expect(store.loading).toBe(false)
  expect(await store.fetch()).toBe(true)
  expect(store.error).toBeNull()
})
it('reset blocks late data from a previous account', async () => {
  const store = useItemsStore(),
    request = deferred<{ data: unknown }>()
  vi.mocked(api.get).mockReturnValue(request.promise)
  const pending = store.fetch()
  store.reset()
  request.resolve({ data: page([item()]) })
  await pending
  expect(store.items).toEqual([])
  expect(store.total).toBe(0)
})
it('rejects malformed response envelopes without replacing valid data', async () => {
  const store = useItemsStore()
  store.items = [item()]
  vi.mocked(api.get).mockResolvedValue({ data: '<html>' })
  expect(await store.fetch()).toBe(false)
  expect(store.error).toMatch(/invalide/)
  expect(store.items).toHaveLength(1)
})
it('a late delete from an old session never filters the new account', async () => {
  const store = useItemsStore(),
    request = deferred<void>()
  setSessionToken('a')
  vi.mocked(api.delete).mockReturnValue(request.promise)
  const pending = store.remove(1)
  setSessionToken('b')
  store.items = [item(1, 'New account')]
  request.resolve()
  await pending
  expect(store.items).toHaveLength(1)
})
