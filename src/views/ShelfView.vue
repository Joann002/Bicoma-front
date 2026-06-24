<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useItemsStore } from '@/stores/items'
import { useTagsStore } from '@/stores/tags'
import { TYPE_LABELS, STATUS_LABELS } from '@/lib/types'
import type { ItemFilters, ItemType, ItemStatus } from '@/lib/types'
import ItemCard from '@/components/ItemCard.vue'
import BaseIcon from '@/components/BaseIcon.vue'

const store = useItemsStore()
const tagsStore = useTagsStore()

const filters = reactive<ItemFilters>({ type: '', status: '', rating: '', q: '', tags: [], page: 1 })
const searchInput = ref('')
let debounce: ReturnType<typeof setTimeout>

const types: ItemType[] = ['book', 'movie', 'series', 'game']
const statuses: ItemStatus[] = ['wishlist', 'in_progress', 'done', 'abandoned']

function load() {
  store.fetch(filters)
}

watch(searchInput, (val) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => {
    filters.q = val
    filters.page = 1
    load()
  }, 300)
})

watch(
  () => [filters.type, filters.status, filters.rating, filters.tags?.join(',')],
  () => {
    filters.page = 1
    load()
  },
)

function toggleTag(name: string) {
  const list = filters.tags ?? []
  filters.tags = list.includes(name) ? list.filter((t) => t !== name) : [...list, name]
}

function changePage(p: number) {
  filters.page = p
  load()
}

onMounted(() => {
  load()
  tagsStore.fetch()
})
</script>

<template>
  <div class="shelf">
    <header class="page-head">
      <div>
        <h1>Étagère</h1>
        <p class="muted">{{ store.total }} élément{{ store.total > 1 ? 's' : '' }} dans votre collection</p>
      </div>
      <div class="page-head__actions">
        <RouterLink :to="{ name: 'import' }" class="btn btn--ghost">
          <BaseIcon name="search" :size="18" /> Importer
        </RouterLink>
        <RouterLink :to="{ name: 'item-new' }" class="btn btn--primary">
          <BaseIcon name="plus" :size="18" /> Ajouter
        </RouterLink>
      </div>
    </header>

    <div class="toolbar">
      <div class="search">
        <BaseIcon name="search" :size="18" />
        <input
          v-model="searchInput"
          class="search__input"
          type="search"
          placeholder="Rechercher un titre, un auteur…"
          aria-label="Rechercher"
        />
      </div>
      <select v-model="filters.type" class="select" aria-label="Type">
        <option value="">Tous les types</option>
        <option v-for="t in types" :key="t" :value="t">{{ TYPE_LABELS[t] }}</option>
      </select>
      <select v-model="filters.status" class="select" aria-label="Statut">
        <option value="">Tous les statuts</option>
        <option v-for="s in statuses" :key="s" :value="s">{{ STATUS_LABELS[s] }}</option>
      </select>
      <select v-model="filters.rating" class="select" aria-label="Note minimale">
        <option value="">Toutes les notes</option>
        <option v-for="n in [5, 4, 3, 2, 1]" :key="n" :value="n">{{ n }}★ et +</option>
      </select>
    </div>

    <div v-if="tagsStore.tags.length" class="tag-row">
      <button
        v-for="tag in tagsStore.tags"
        :key="tag.id"
        class="tag-toggle"
        :class="{ 'tag-toggle--on': filters.tags?.includes(tag.name) }"
        @click="toggleTag(tag.name)"
      >
        {{ tag.name }}
      </button>
    </div>

    <!-- Loading skeletons -->
    <div v-if="store.loading" class="grid">
      <div v-for="n in 12" :key="n" class="skel-card">
        <div class="skeleton skel-cover"></div>
        <div class="skeleton skel-line"></div>
        <div class="skeleton skel-line skel-line--short"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!store.items.length" class="empty">
      <BaseIcon name="library" :size="48" />
      <h2>Votre étagère est vide</h2>
      <p class="muted">Ajoutez votre premier titre ou importez-le depuis une API externe.</p>
      <RouterLink :to="{ name: 'item-new' }" class="btn btn--primary">
        <BaseIcon name="plus" :size="18" /> Ajouter un élément
      </RouterLink>
    </div>

    <!-- Grid -->
    <div v-else class="grid">
      <ItemCard v-for="item in store.items" :key="item.id" :item="item" />
    </div>

    <nav v-if="store.lastPage > 1" class="pager" aria-label="Pagination">
      <button class="btn btn--sm" :disabled="store.page <= 1" @click="changePage(store.page - 1)">
        Précédent
      </button>
      <span class="muted">Page {{ store.page }} / {{ store.lastPage }}</span>
      <button
        class="btn btn--sm"
        :disabled="store.page >= store.lastPage"
        @click="changePage(store.page + 1)"
      >
        Suivant
      </button>
    </nav>
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
