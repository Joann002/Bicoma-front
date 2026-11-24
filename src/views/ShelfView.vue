<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useItemsStore } from '@/stores/items'
import { useTagsStore } from '@/stores/tags'
import { TYPE_LABELS, STATUS_LABELS } from '@/lib/types'
import type { ItemType, ItemStatus } from '@/lib/types'
import { readItemQuery, itemQuery } from '@/lib/itemQuery'
import { downloadCsv } from '@/lib/csv'
import { errorMessage } from '@/lib/errors'
import ItemCard from '@/components/ItemCard.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import ErrorNotice from '@/components/ErrorNotice.vue'
import PageControls from '@/components/PageControls.vue'
const store = useItemsStore(),
  tagsStore = useTagsStore(),
  route = useRoute(),
  router = useRouter()
const filters = computed(() => readItemQuery(route.query)),
  searchInput = ref(filters.value.q ?? ''),
  exportError = ref<string | null>(null)
const activeFilters = computed(() =>
  Boolean(
    filters.value.type ||
    filters.value.status ||
    filters.value.rating ||
    filters.value.q ||
    filters.value.tags?.length,
  ),
)
const types: ItemType[] = ['book', 'movie', 'series', 'game'],
  statuses: ItemStatus[] = ['wishlist', 'in_progress', 'done', 'abandoned']
let debounce: ReturnType<typeof setTimeout> | undefined
async function load() {
  const current = filters.value
  exportError.value = null
  const ok = await store.fetch(current)
  if (ok && store.page !== current.page)
    void router.replace({ query: itemQuery({ ...current, page: store.page }) })
}
function setFilter(key: string, value: unknown) {
  void router.push({ query: itemQuery({ ...filters.value, [key]: value, page: 1 }) })
}
function selectFilter(key: string, event: Event) {
  setFilter(key, (event.target as HTMLSelectElement).value)
}
function toggleTag(name: string) {
  const tags = filters.value.tags ?? []
  setFilter('tags', tags.includes(name) ? tags.filter((tag) => tag !== name) : [...tags, name])
}
function changePage(page: number) {
  void router.push({ query: itemQuery({ ...filters.value, page }) })
}
function reset() {
  void router.push({ query: {} })
}
function exportPage() {
  try {
    downloadCsv(store.items)
  } catch (error) {
    exportError.value = errorMessage(error)
  }
}
watch(searchInput, (value) => {
  clearTimeout(debounce)
  if (value === (filters.value.q ?? '')) return
  debounce = setTimeout(() => {
    void router.replace({ query: itemQuery({ ...filters.value, q: value, page: 1 }) })
  }, 300)
})
watch(
  () => route.fullPath,
  () => {
    clearTimeout(debounce)
    searchInput.value = filters.value.q ?? ''
    void load()
  },
  { immediate: true },
)
onMounted(() => {
  void tagsStore.fetch()
})
onScopeDispose(() => {
  clearTimeout(debounce)
  store.cancel()
})
</script>

<template>
  <div class="shelf">
    <header class="page-head">
      <div>
        <h1>Étagère</h1>
        <p class="muted" role="status">
          {{
            store.loading
              ? 'Chargement de votre collection…'
              : store.error
                ? 'Votre collection personnelle'
                : `${store.total} élément${store.total > 1 ? 's' : ''} dans votre collection`
          }}
        </p>
      </div>
      <div class="page-head__actions">
        <button
          type="button"
          class="btn btn--ghost"
          :disabled="store.loading || !!store.error || !store.items.length"
          @click="exportPage"
        >
          Exporter cette page (CSV)</button
        ><RouterLink :to="{ name: 'import' }" class="btn btn--ghost"
          ><BaseIcon name="search" :size="18" />Importer</RouterLink
        ><RouterLink :to="{ name: 'item-new' }" class="btn btn--primary"
          ><BaseIcon name="plus" :size="18" />Ajouter</RouterLink
        >
      </div>
    </header>
    <div class="toolbar">
      <div class="search">
        <BaseIcon name="search" :size="18" /><input
          v-model="searchInput"
          class="search__input"
          type="search"
          maxlength="200"
          placeholder="Rechercher un titre, un auteur…"
          aria-label="Rechercher"
        />
      </div>
      <select
        :value="filters.type"
        class="select"
        aria-label="Type"
        @change="selectFilter('type', $event)"
      >
        <option value="">Tous les types</option>
        <option v-for="type in types" :key="type" :value="type">
          {{ TYPE_LABELS[type] }}
        </option></select
      ><select
        :value="filters.status"
        class="select"
        aria-label="Statut"
        @change="selectFilter('status', $event)"
      >
        <option value="">Tous les statuts</option>
        <option v-for="status in statuses" :key="status" :value="status">
          {{ STATUS_LABELS[status] }}
        </option></select
      ><select
        :value="filters.rating"
        class="select"
        aria-label="Note minimale"
        @change="selectFilter('rating', $event)"
      >
        <option value="">Toutes les notes</option>
        <option v-for="n in [5, 4, 3, 2, 1]" :key="n" :value="n">{{ n }}★ et +</option>
      </select>
    </div>
    <div v-if="tagsStore.tags.length" class="tag-row">
      <button
        v-for="tag in tagsStore.tags"
        :key="tag.id"
        type="button"
        class="tag-toggle"
        :class="{ 'tag-toggle--on': filters.tags?.includes(tag.name) }"
        :aria-pressed="filters.tags?.includes(tag.name) ?? false"
        @click="toggleTag(tag.name)"
      >
        {{ tag.name }}
      </button>
    </div>
    <button v-if="activeFilters" type="button" class="btn btn--ghost" @click="reset">
      Réinitialiser les filtres
    </button>
    <ErrorNotice
      v-if="tagsStore.error"
      :message="tagsStore.error"
      retry
      @retry="tagsStore.fetch()"
    />
    <ErrorNotice v-if="exportError" :message="exportError" />
    <p v-if="store.items.length && !store.loading && !store.error" class="subtle">
      Le CSV contient uniquement les {{ store.items.length }} éléments de cette page et vos notes
      personnelles.
    </p>
    <div v-if="store.loading" class="grid" aria-label="Chargement des éléments" aria-busy="true">
      <div v-for="n in 12" :key="n" class="skel-card" aria-hidden="true">
        <div class="skeleton skel-cover"></div>
        <div class="skeleton skel-line"></div>
      </div>
    </div>
    <ErrorNotice v-else-if="store.error" :message="store.error" retry @retry="load" />
    <div v-else-if="!store.items.length" class="empty">
      <BaseIcon name="library" :size="48" />
      <h2>{{ activeFilters ? 'Aucun résultat' : 'Votre étagère est vide' }}</h2>
      <p class="muted">
        {{
          activeFilters
            ? 'Modifiez vos filtres ou votre recherche.'
            : 'Ajoutez votre premier titre à votre collection.'
        }}
      </p>
      <button v-if="activeFilters" type="button" class="btn btn--primary" @click="reset">
        Effacer les filtres</button
      ><RouterLink v-else :to="{ name: 'item-new' }" class="btn btn--primary"
        >Ajouter un élément</RouterLink
      >
    </div>
    <div v-else class="grid">
      <ItemCard v-for="item in store.items" :key="item.id" :item="item" />
    </div>
    <PageControls
      v-if="!store.error"
      :page="store.page"
      :last-page="store.lastPage"
      :loading="store.loading"
      @change="changePage"
    />
  </div>
</template>
<style scoped>
.shelf {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.page-head h1 {
  font-size: var(--text-3xl);
}
.page-head__actions {
  display: flex;
  gap: var(--space-2);
}
.toolbar {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: var(--space-2);
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
  min-height: 44px;
  background: none;
  border: none;
  outline: none;
  color: var(--text);
}
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.tag-toggle {
  padding: 4px var(--space-3);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text-muted);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--dur) var(--ease-out);
}
.tag-toggle:hover {
  background: var(--surface-2);
}
.tag-toggle--on {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-4);
}
.skel-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.skel-cover {
  aspect-ratio: 2 / 3;
}
.skel-line {
  height: 12px;
  width: 90%;
}
.skel-line--short {
  width: 55%;
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
  padding: var(--space-8) var(--space-4);
  color: var(--text-subtle);
}
.empty h2 {
  color: var(--text);
}
.empty .btn {
  margin-top: var(--space-2);
}
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

@media (max-width: 700px) {
  .toolbar {
    grid-template-columns: 1fr 1fr;
  }
  .search {
    grid-column: 1 / -1;
  }
}
</style>
