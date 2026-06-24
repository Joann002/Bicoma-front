export type ItemType = 'book' | 'movie' | 'series' | 'game'
export type ItemStatus = 'wishlist' | 'in_progress' | 'done' | 'abandoned'

export interface User {
  id: number
  name: string
  email: string
}

export interface Loan {
  id: number
  item_id: number
  item?: { id: number; title: string; type: ItemType; cover_url: string | null }
  borrower_name: string
  loan_date: string | null
  return_date: string | null
  returned: boolean
  returned_at: string | null
  overdue: boolean
}

export interface Item {
  id: number
  type: ItemType
  title: string
  creator: string | null
  cover_url: string | null
  status: ItemStatus
  rating: number | null
  notes: string | null
  synopsis: string | null
  genre: string | null
  external_id: string | null
  external_source: string | null
  added_at: string | null
  finished_at: string | null
  tags?: string[]
  active_loan?: Loan | null
  created_at: string | null
}

export interface Tag {
  id: number
  name: string
  items_count?: number
}

export interface CatalogResult {
  type: ItemType
  external_source: string
  external_id: string
  title: string
  creator: string | null
  cover_url: string | null
  synopsis: string | null
  genre: string | null
  year: number | null
}

export interface Challenge {
  id: number
  year: number
  target_count: number
}

export interface SharedList {
  id: number
  token: string
  title: string
  filters: Record<string, string> | null
  is_active: boolean
}

export interface Stats {
  total: number
  by_type: Record<string, number>
  by_status: Record<string, number>
  by_genre: Record<string, number>
  ratings: Record<string, number>
  challenge: {
    year: number
    target: number | null
    completed: number
    percentage: number | null
  }
}

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number; last_page: number; total: number; per_page: number }
}

export interface ItemFilters {
  type?: ItemType | ''
  status?: ItemStatus | ''
  rating?: number | ''
  q?: string
  tags?: string[]
  per_page?: number
  page?: number
}

export const TYPE_LABELS: Record<ItemType, string> = {
  book: 'Livre',
  movie: 'Film',
  series: 'Série',
  game: 'Jeu',
}

export const STATUS_LABELS: Record<ItemStatus, string> = {
  wishlist: 'À découvrir',
  in_progress: 'En cours',
  done: 'Terminé',
  abandoned: 'Abandonné',
}
