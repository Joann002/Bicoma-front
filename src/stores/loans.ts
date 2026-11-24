import { sessionEpoch } from '@/lib/session'
import { latestRequest } from '@/lib/latestRequest'
import { errorMessage, isCancelled } from '@/lib/errors'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'
import type { Loan } from '@/lib/types'

export const useLoansStore = defineStore('loans', () => {
  const requests = latestRequest(),
    error = ref<string | null>(null)
  const loans = ref<Loan[]>([])
  const loading = ref(false)

  function reset() {
    requests.cancel()
    loans.value = []
    loading.value = false
    error.value = null
  }
  async function fetch(activeOnly = false) {
    const request = requests.start()
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/loans', {
        params: { active: activeOnly ? 1 : undefined },
        signal: request.signal,
      })
      if (request.current()) loans.value = data.data
      return request.current()
    } catch (cause) {
      if (request.current() && !isCancelled(cause)) error.value = errorMessage(cause)
      return false
    } finally {
      if (request.current()) loading.value = false
    }
  }

  async function create(payload: {
    item_id: number
    borrower_name: string
    return_date?: string | null
  }): Promise<Loan> {
    const { data } = await api.post('/loans', payload)
    return data.data
  }

  async function markReturned(id: number) {
    const epoch = sessionEpoch()
    const { data } = await api.post(`/loans/${id}/return`)
    const i = loans.value.findIndex((l) => l.id === id)
    if (i !== -1 && epoch === sessionEpoch()) loans.value[i] = data.data
    return data.data as Loan
  }

  async function remove(id: number) {
    await api.delete(`/loans/${id}`)
    loans.value = loans.value.filter((l) => l.id !== id)
  }

  return { loans, loading, error, fetch, create, markReturned, remove, reset }
})
