import { beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { api } from '@/lib/api'
import { useTagsStore } from '@/stores/tags'
import { useLoansStore } from '@/stores/loans'
import { useStatsStore } from '@/stores/stats'
import { deferred } from './fixtures'
vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))
beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(api.get).mockReset()
})
it('tag and loan errors are observable and do not become unhandled rejections', async () => {
  vi.mocked(api.get).mockRejectedValue(new Error('offline'))
  const tags = useTagsStore(),
    loans = useLoansStore()
  await Promise.all([tags.fetch(), loans.fetch()])
  expect(tags.error).toBe('offline')
  expect(loans.error).toBe('offline')
  expect(loans.loading).toBe(false)
})
it('reset invalidates late statistics responses and clears every cached summary', async () => {
  const stats = useStatsStore(),
    a = deferred<{ data: unknown }>(),
    b = deferred<{ data: unknown }>()
  vi.mocked(api.get).mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise)
  const pending = stats.fetch()
  stats.reset()
  a.resolve({ data: { data: { total: 5 } } })
  b.resolve({ data: { data: [{ id: 1 }] } })
  await pending
  expect(stats.stats).toBeNull()
  expect(stats.challenges).toEqual([])
  expect(stats.loading).toBe(false)
})
