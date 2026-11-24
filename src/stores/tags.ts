import { latestRequest } from '@/lib/latestRequest'
import { errorMessage, isCancelled } from '@/lib/errors'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'
import type { Tag } from '@/lib/types'

export const useTagsStore = defineStore('tags', () => {
  const requests = latestRequest(),
    error = ref<string | null>(null)
  const tags = ref<Tag[]>([])

  function reset() {
    requests.cancel()
    tags.value = []
    error.value = null
  }
  async function fetch() {
    const request = requests.start()
    error.value = null
    try {
      const { data } = await api.get('/tags', { signal: request.signal })
      if (request.current()) tags.value = data.data
      return request.current()
    } catch (cause) {
      if (request.current() && !isCancelled(cause)) error.value = errorMessage(cause)
      return false
    }
  }

  return { tags, error, fetch, reset }
})
