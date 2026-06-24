<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { useItemsStore } from '@/stores/items'
import { useToast } from '@/composables/useToast'
import { TYPE_LABELS } from '@/lib/types'
import type { CatalogResult, ItemType } from '@/lib/types'
import BaseIcon from '@/components/BaseIcon.vue'
import { AxiosError } from 'axios'

const router = useRouter()
const store = useItemsStore()
const toast = useToast()

const type = ref<ItemType>('book')
const query = ref('')
const results = ref<CatalogResult[]>([])
const loading = ref(false)
const error = ref('')
const importingId = ref('')
let debounce: ReturnType<typeof setTimeout>

const types: ItemType[] = ['book', 'movie', 'series', 'game']
const typeIcon: Record<ItemType, string> = { book: 'book', movie: 'film', series: 'tv', game: 'gamepad' }

async function search() {
  error.value = ''
  if (query.value.trim().length < 2) {
    results.value = []
    return
  }
  loading.value = true
  try {
    const { data } = await api.get('/search', { params: { type: type.value, q: query.value } })
    results.value = data.data
  } catch (e) {
    const err = e as AxiosError<{ message?: string }>
    error.value = err.response?.data?.message ?? 'Recherche indisponible.'
    results.value = []
  } finally {
    loading.value = false
  }
}

watch([query, type], () => {
  clearTimeout(debounce)
  debounce = setTimeout(search, 350)
})

async function quickAdd(result: CatalogResult) {
  importingId.value = result.external_id
  try {
    const item = await store.create({
      type: result.type,
      title: result.title,
      creator: result.creator,
      cover_url: result.cover_url,
      synopsis: result.synopsis,
      genre: result.genre,
      external_id: result.external_id,
      external_source: result.external_source,
      status: 'wishlist',
    })
    toast.success(`« ${result.title} » ajouté à votre wishlist`)
    router.push({ name: 'item-detail', params: { id: item.id } })
  } catch {
    toast.error("Impossible d'ajouter cet élément.")
  } finally {
    importingId.value = ''
  }
}
</script>

<template>
  <div class="import">
    <header>
      <h1>Importer</h1>
      <p class="muted">
        Recherchez dans Open Library (livres), TMDB (films/séries) ou RAWG (jeux). Les couvertures et
        synopsis sont récupérés automatiquement.
      </p>
    </header>

    <div class="search-bar">
      <div class="type-tabs">
        <button
          v-for="t in types"
          :key="t"
          class="type-tab"
          :class="{ 'type-tab--on': type === t }"
          @click="type = t"
        >
          <BaseIcon :name="typeIcon[t]" :size="16" /> {{ TYPE_LABELS[t] }}
        </button>
      </div>
      <div class="search">
        <BaseIcon name="search" :size="18" />
        <input
          v-model="query"
          class="search__input"
          type="search"
          :placeholder="`Rechercher un ${TYPE_LABELS[type].toLowerCase()}…`"
          aria-label="Rechercher"
        />
      </div>
    </div>

    <p v-if="error" class="error card" role="alert">
      <BaseIcon name="close" :size="16" /> {{ error }}
    </p>

    <div v-if="loading" class="results">
      <div v-for="n in 4" :key="n" class="result-skel">
        <div class="skeleton" style="width: 60px; height: 90px"></div>
        <div class="skeleton" style="height: 16px; width: 60%"></div>
      </div>
    </div>

    <div v-else-if="results.length" class="results">
      <article v-for="r in results" :key="r.external_id" class="result card">
        <div class="result__cover">
          <img v-if="r.cover_url" :src="r.cover_url" :alt="r.title" loading="lazy" />
          <div v-else class="result__cover-ph"><BaseIcon :name="typeIcon[r.type]" :size="24" /></div>
        </div>
        <div class="result__info">
          <strong>{{ r.title }}</strong>
          <span v-if="r.creator" class="muted">{{ r.creator }}</span>
          <span v-if="r.year" class="subtle">{{ r.year }}</span>
          <p v-if="r.synopsis" class="result__synopsis subtle">{{ r.synopsis }}</p>
        </div>
        <button
          class="btn btn--primary btn--sm"
          :disabled="importingId === r.external_id"
          @click="quickAdd(r)"
        >
          <BaseIcon name="plus" :size="15" />
          {{ importingId === r.external_id ? 'Ajout…' : 'Ajouter' }}
        </button>
      </article>
    </div>

    <div v-else-if="query.length >= 2" class="empty muted">Aucun résultat pour « {{ query }} ».</div>
  </div>
</template>

<style scoped>
.import {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
header h1 {
  font-size: var(--text-3xl);
}
header p {
  max-width: 60ch;
}
.search-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.type-tabs {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.type-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius);
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--dur) var(--ease-out);
}
.type-tab--on {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
}
.search {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  color: var(--text-subtle);
}
.search:focus-within {
  border-color: var(--accent);
}
.search__input {
  flex: 1;
  min-height: 48px;
  background: none;
  border: none;
  outline: none;
  color: var(--text);
}
.results {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.result {
  display: grid;
  grid-template-columns: 60px 1fr auto;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-3);
}
.result__cover {
  width: 60px;
  height: 90px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--surface-2);
}
.result__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.result__cover-ph {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--text-subtle);
}
.result__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.result__synopsis {
  font-size: var(--text-xs);
  margin-top: var(--space-1);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.result-skel {
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-3);
}
.error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  color: var(--danger);
}
.empty {
  padding: var(--space-6);
  text-align: center;
}
@media (max-width: 560px) {
  .result {
    grid-template-columns: 60px 1fr;
  }
  .result > .btn {
    grid-column: 1 / -1;
  }
}
</style>
