import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'
import type { Item, ItemFilters } from '@/lib/types'

export const useItemsStore = defineStore('items', () => {
  const items = ref<Item[]>([])
  const loading = ref(false)
  const page = ref(1)
  const lastPage = ref(1)
  const total = ref(0)

  function buildParams(filters: ItemFilters) {
    const params: Record<string, unknown> = {}
    if (filters.type) params.type = filters.type
    if (filters.status) params.status = filters.status
    if (filters.rating) params.rating = filters.rating
    if (filters.q) params.q = filters.q
    if (filters.tags?.length) params.tags = filters.tags
    params.per_page = filters.per_page ?? 24
    params.page = filters.page ?? 1
    return params
  }

  async function fetch(filters: ItemFilters = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/items', { params: buildParams(filters) })
      items.value = data.data
      page.value = data.meta?.current_page ?? 1
      lastPage.value = data.meta?.last_page ?? 1
      total.value = data.meta?.total ?? data.data.length
    } finally {
      loading.value = false
    }
  }

  async function get(id: number): Promise<Item> {
    const { data } = await api.get(`/items/${id}`)
    return data.data
  }

  async function create(payload: Partial<Item>): Promise<Item> {
    const { data } = await api.post('/items', payload)
    return data.data
  }

  async function update(id: number, payload: Partial<Item>): Promise<Item> {
    const { data } = await api.put(`/items/${id}`, payload)
    return data.data
  }

  async function remove(id: number) {
    await api.delete(`/items/${id}`)
    items.value = items.value.filter((i) => i.id !== id)
  }

  return { items, loading, page, lastPage, total, fetch, get, create, update, remove }
})
