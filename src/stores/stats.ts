import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'
import type { Stats, Challenge } from '@/lib/types'

export const useStatsStore = defineStore('stats', () => {
  const stats = ref<Stats | null>(null)
  const challenges = ref<Challenge[]>([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    try {
      const [s, c] = await Promise.all([api.get('/stats'), api.get('/challenges')])
      stats.value = s.data.data
      challenges.value = c.data.data
    } finally {
      loading.value = false
    }
  }

  async function saveChallenge(year: number, target_count: number) {
    await api.post('/challenges', { year, target_count })
    await fetch()
  }

  return { stats, challenges, loading, fetch, saveChallenge }
})
