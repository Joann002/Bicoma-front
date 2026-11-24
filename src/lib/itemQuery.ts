import type { ItemFilters, ItemStatus, ItemType } from './types'
const types = ['book', 'movie', 'series', 'game']
const statuses = ['wishlist', 'in_progress', 'done', 'abandoned']
function first(value: unknown): string {
  return typeof value === 'string'
    ? value
    : Array.isArray(value) && typeof value[0] === 'string'
      ? value[0]
      : ''
}
export function positiveInteger(value: unknown, fallback = 1, maximum = 100000): number {
  const text = typeof value === 'number' ? String(value) : first(value)
  return /^\d{1,7}$/.test(text) && Number(text) >= 1 && Number(text) <= maximum
    ? Number(text)
    : fallback
}
export function readItemQuery(query: Record<string, unknown>): ItemFilters {
  const type = first(query.type),
    status = first(query.status),
    rating = Number(first(query.rating))
  const rawTags = Array.isArray(query.tag) ? query.tag : query.tag ? [query.tag] : []
  return {
    type: types.includes(type) ? (type as ItemType) : '',
    status: statuses.includes(status) ? (status as ItemStatus) : '',
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : '',
    q: first(query.q).slice(0, 200),
    tags: [
      ...new Set(
        rawTags
          .filter((x): x is string => typeof x === 'string')
          .map((x) => x.trim())
          .filter(Boolean),
      ),
    ].slice(0, 20),
    page: positiveInteger(query.page),
  }
}
export function itemQuery(filters: ItemFilters): Record<string, string | string[]> {
  const normalized = readItemQuery({
    ...filters,
    rating: String(filters.rating ?? ''),
    page: String(filters.page ?? 1),
    tag: filters.tags,
  })
  const result: Record<string, string | string[]> = {}
  if (normalized.type) result.type = normalized.type
  if (normalized.status) result.status = normalized.status
  if (normalized.rating) result.rating = String(normalized.rating)
  if (normalized.q) result.q = normalized.q
  if (normalized.tags?.length) result.tag = normalized.tags
  if (normalized.page && normalized.page > 1) result.page = String(normalized.page)
  return result
}
export function itemParams(filters: ItemFilters): Record<string, unknown> {
  const normalized = readItemQuery({
    ...filters,
    rating: String(filters.rating ?? ''),
    page: String(filters.page ?? 1),
    tag: filters.tags,
  })
  const params: Record<string, unknown> = {
    page: normalized.page,
    per_page: positiveInteger(filters.per_page, 24, 100),
  }
  for (const key of ['type', 'status', 'rating', 'q'] as const)
    if (normalized[key]) params[key] = normalized[key]
  if (normalized.tags?.length) params.tags = normalized.tags
  return params
}
export function safeRedirect(value: unknown): string {
  const path = first(value)
  return /^\/(?!\/)/.test(path) &&
    !/[\\\x00-\x20\x7f]/.test(path) &&
    !/^\/(?:login|register)(?:[/?#]|$)/.test(path)
    ? path
    : '/'
}
