import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'
import type { Loan } from '@/lib/types'

export const useLoansStore = defineStore('loans', () => {
  const loans = ref<Loan[]>([])
  const loading = ref(false)

  async function fetch(activeOnly = false) {
    loading.value = true
    try {
      const { data } = await api.get('/loans', { params: { active: activeOnly ? 1 : undefined } })
      loans.value = data.data
    } finally {
      loading.value = false
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
    const { data } = await api.post(`/loans/${id}/return`)
    const i = loans.value.findIndex((l) => l.id === id)
    if (i !== -1) loans.value[i] = data.data
    return data.data as Loan
  }

  async function remove(id: number) {
    await api.delete(`/loans/${id}`)
    loans.value = loans.value.filter((l) => l.id !== id)
  }

  return { loans, loading, fetch, create, markReturned, remove }
})
