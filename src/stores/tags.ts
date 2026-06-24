import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'
import type { Tag } from '@/lib/types'

export const useTagsStore = defineStore('tags', () => {
  const tags = ref<Tag[]>([])

  async function fetch() {
    const { data } = await api.get('/tags')
    tags.value = data.data
  }

  return { tags, fetch }
})
