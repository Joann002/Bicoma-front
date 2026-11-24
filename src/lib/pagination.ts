import { positiveInteger } from './itemQuery'
export function parsePage<T>(value: unknown): {
  items: T[]
  page: number
  lastPage: number
  total: number
} {
  if (!value || typeof value !== 'object' || !('data' in value) || !Array.isArray(value.data))
    throw new Error('La réponse du serveur est invalide. Réessayez.')
  const meta =
    'meta' in value && value.meta && typeof value.meta === 'object'
      ? (value.meta as Record<string, unknown>)
      : {}
  const lastPage = positiveInteger(meta.last_page),
    page = Math.min(lastPage, positiveInteger(meta.current_page))
  const total =
    typeof meta.total === 'number' && Number.isSafeInteger(meta.total) && meta.total >= 0
      ? meta.total
      : value.data.length
  return { items: value.data as T[], page, lastPage, total }
}
