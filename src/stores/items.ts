import { sessionEpoch } from '@/lib/session'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'
import type { Item, ItemFilters } from '@/lib/types'
import { itemParams } from '@/lib/itemQuery'
import { parsePage } from '@/lib/pagination'
import { latestRequest } from '@/lib/latestRequest'
import { errorMessage, isCancelled } from '@/lib/errors'
export const useItemsStore = defineStore('items', () => {
  const items = ref<Item[]>([]),
    loading = ref(false),
    error = ref<string | null>(null),
    page = ref(1),
    lastPage = ref(1),
    total = ref(0),
    requests = latestRequest()
  function reset() {
    requests.cancel()
    items.value = []
    loading.value = false
    error.value = null
    page.value = 1
    lastPage.value = 1
    total.value = 0
  }
  async function fetch(filters: ItemFilters = {}) {
    const request = requests.start()
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/items', {
        params: itemParams(filters),
        signal: request.signal,
      })
      if (!request.current()) return false
      const parsed = parsePage<Item>(data)
      items.value = parsed.items
      page.value = parsed.page
      lastPage.value = parsed.lastPage
      total.value = parsed.total
      return true
    } catch (cause) {
      if (request.current() && !isCancelled(cause)) error.value = errorMessage(cause)
      return false
    } finally {
      if (request.current()) loading.value = false
    }
  }
  async function get(id: number, signal?: AbortSignal): Promise<Item> {
    const { data } = await api.get(`/items/${id}`, { signal })
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
    const epoch = sessionEpoch()
    await api.delete(`/items/${id}`)
    if (epoch === sessionEpoch()) items.value = items.value.filter((item) => item.id !== id)
  }
  return {
    items,
    loading,
    error,
    page,
    lastPage,
    total,
    fetch,
    get,
    create,
    update,
    remove,
    reset,
    cancel: requests.cancel,
  }
})
