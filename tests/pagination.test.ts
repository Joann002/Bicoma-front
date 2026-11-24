import { expect, it } from 'vitest'
import { parsePage } from '@/lib/pagination'
import { item, page } from './fixtures'
it('validates envelopes and clamps impossible pagination metadata', () => {
  expect(parsePage(page([item()], 3, 2))).toMatchObject({ page: 2, lastPage: 2, total: 1 })
  expect(parsePage({ data: [], meta: { last_page: NaN, current_page: -1, total: -4 } })).toEqual({
    items: [],
    page: 1,
    lastPage: 1,
    total: 0,
  })
})
it('rejects HTML, null and malformed collections without a partial update', () => {
  for (const data of [null, '<html>', { data: null }, { data: {} }, []])
    expect(() => parsePage(data)).toThrow(/invalide/)
  expect(parsePage({ data: [1, 2] }).total).toBe(2)
})
