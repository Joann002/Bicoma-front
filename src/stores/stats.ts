import { latestRequest } from '@/lib/latestRequest'
import { errorMessage, isCancelled } from '@/lib/errors'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'
import type { Stats, Challenge } from '@/lib/types'

export const useStatsStore = defineStore('stats', () => {
  const requests = latestRequest(),
    error = ref<string | null>(null)
  const stats = ref<Stats | null>(null)
  const challenges = ref<Challenge[]>([])
  const loading = ref(false)

  function reset() {
    requests.cancel()
    stats.value = null
    challenges.value = []
    loading.value = false
    error.value = null
  }
  async function fetch() {
    const request = requests.start()
    loading.value = true
    error.value = null
    try {
      const [s, c] = await Promise.all([
        api.get('/stats', { signal: request.signal }),
        api.get('/challenges', { signal: request.signal }),
      ])
      if (request.current()) {
        stats.value = s.data.data
        challenges.value = c.data.data
      }
      return request.current()
    } catch (cause) {
      if (request.current() && !isCancelled(cause)) error.value = errorMessage(cause)
      return false
    } finally {
      if (request.current()) loading.value = false
    }
  }

  async function saveChallenge(year: number, target_count: number) {
    await api.post('/challenges', { year, target_count })
    await fetch()
  }

  return { stats, challenges, loading, error, fetch, saveChallenge, reset }
})
