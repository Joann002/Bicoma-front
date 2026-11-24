import type { Item } from '@/lib/types'
export function item(id = 1, title = 'Dune'): Item {
  return {
    id,
    title,
    type: 'book',
    creator: 'Auteur',
    cover_url: null,
    status: 'wishlist',
    rating: null,
    notes: null,
    synopsis: null,
    genre: null,
    external_id: null,
    external_source: null,
    added_at: null,
    finished_at: null,
    created_at: null,
    tags: [],
  }
}
export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((a, b) => {
    resolve = a
    reject = b
  })
  return { promise, resolve, reject }
}
export const page = (items: Item[], current = 1, last = 1) => ({
  data: items,
  meta: { current_page: current, last_page: last, total: items.length, per_page: 24 },
})
