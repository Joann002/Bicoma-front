import { expect, it } from 'vitest'
import { readItemQuery, itemQuery, itemParams, safeRedirect } from '@/lib/itemQuery'
it('round-trips supported filters and repeated Unicode tags', () => {
  const filters = readItemQuery({
    type: 'book',
    status: 'done',
    rating: '4',
    q: 'été',
    tag: ['favori', 'favori', 'à lire'],
    page: '2',
  })
  expect(filters.tags).toEqual(['favori', 'à lire'])
  expect(itemQuery(filters)).toEqual({
    type: 'book',
    status: 'done',
    rating: '4',
    q: 'été',
    tag: ['favori', 'à lire'],
    page: '2',
  })
  expect(itemParams(filters)).toMatchObject({
    type: 'book',
    rating: 4,
    tags: ['favori', 'à lire'],
    page: 2,
    per_page: 24,
  })
})
it('rejects malformed enum, page and rating values without forwarding them', () => {
  expect(
    readItemQuery({ type: 'admin', status: 'other', rating: 'NaN', page: '-2' }),
  ).toMatchObject({ type: '', status: '', rating: '', page: 1 })
  expect(itemQuery({ page: 1 })).toEqual({})
  expect(itemParams({ per_page: 9999 })).toMatchObject({ per_page: 24 })
})
it('bounds search and tag input and never redirects off-site or back to login', () => {
  expect(
    readItemQuery({ q: 'x'.repeat(300), tag: Array.from({ length: 30 }, (_, i) => String(i)) }).q,
  ).toHaveLength(200)
  expect(readItemQuery({ tag: Array.from({ length: 30 }, (_, i) => String(i)) }).tags).toHaveLength(
    20,
  )
  for (const value of [
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/login?next=/items',
    '/register',
    '/foo\nbar',
  ])
    expect(safeRedirect(value)).toBe('/')
  expect(safeRedirect('/items/2?x=1')).toBe('/items/2?x=1')
})
