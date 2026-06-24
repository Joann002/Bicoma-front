<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { api } from '@/lib/api'
import { useToast } from '@/composables/useToast'
import { TYPE_LABELS, STATUS_LABELS } from '@/lib/types'
import type { SharedList, ItemType, ItemStatus } from '@/lib/types'
import BaseIcon from '@/components/BaseIcon.vue'

const toast = useToast()
const lists = ref<SharedList[]>([])
const loading = ref(true)
const creating = ref(false)

const form = reactive({ title: '', type: '' as ItemType | '', status: '' as ItemStatus | '' })
const types: ItemType[] = ['book', 'movie', 'series', 'game']
const statuses: ItemStatus[] = ['wishlist', 'in_progress', 'done', 'abandoned']

function publicUrl(token: string) {
  return `${window.location.origin}/share/${token}`
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/shared-lists')
    lists.value = data.data
  } finally {
    loading.value = false
  }
}

async function create() {
  if (!form.title.trim()) return
  const filters: Record<string, string> = {}
  if (form.type) filters.type = form.type
  if (form.status) filters.status = form.status
  const { data } = await api.post('/shared-lists', {
    title: form.title,
    filters: Object.keys(filters).length ? filters : null,
  })
  lists.value.unshift(data.data)
  form.title = ''
  form.type = ''
  form.status = ''
  creating.value = false
  toast.success('Liste partagée créée')
}

async function remove(list: SharedList) {
  if (!confirm(`Supprimer la liste « ${list.title} » ?`)) return
  await api.delete(`/shared-lists/${list.id}`)
  lists.value = lists.value.filter((l) => l.id !== list.id)
  toast.success('Liste supprimée')
}

async function copy(token: string) {
  await navigator.clipboard.writeText(publicUrl(token))
  toast.success('Lien copié dans le presse-papier')
}

onMounted(load)
</script>

<template>
  <div class="shared">
    <header class="page-head">
      <div>
        <h1>Listes partagées</h1>
        <p class="muted">Partagez une sélection en lecture seule via un lien public.</p>
      </div>
      <button class="btn btn--primary" @click="creating = !creating">
        <BaseIcon name="plus" :size="18" /> Nouvelle liste
      </button>
    </header>

    <form v-if="creating" class="card create" @submit.prevent="create">
      <div class="field">
        <label for="title">Titre de la liste</label>
        <input id="title" v-model="form.title" class="input" placeholder="Mes coups de cœur" required />
      </div>
      <div class="create__filters">
        <div class="field">
          <label for="ftype">Filtrer par type</label>
          <select id="ftype" v-model="form.type" class="select">
            <option value="">Tous</option>
            <option v-for="t in types" :key="t" :value="t">{{ TYPE_LABELS[t] }}</option>
          </select>
        </div>
        <div class="field">
          <label for="fstatus">Filtrer par statut</label>
          <select id="fstatus" v-model="form.status" class="select">
            <option value="">Tous</option>
            <option v-for="s in statuses" :key="s" :value="s">{{ STATUS_LABELS[s] }}</option>
          </select>
        </div>
      </div>
      <div class="create__actions">
        <button type="button" class="btn btn--ghost" @click="creating = false">Annuler</button>
        <button type="submit" class="btn btn--primary">Créer</button>
      </div>
    </form>

    <div v-if="loading" class="muted">Chargement…</div>

    <div v-else-if="!lists.length" class="empty card">
      <BaseIcon name="share" :size="40" />
      <p class="muted">Aucune liste partagée pour l'instant.</p>
    </div>

    <ul v-else class="list">
      <li v-for="list in lists" :key="list.id" class="row card">
        <div class="row__info">
          <strong>{{ list.title }}</strong>
          <div class="row__filters">
            <span v-if="list.filters?.type" class="badge">{{ TYPE_LABELS[list.filters.type as ItemType] }}</span>
            <span v-if="list.filters?.status" class="badge">{{ STATUS_LABELS[list.filters.status as ItemStatus] }}</span>
            <span v-if="!list.filters" class="subtle">Toute la collection</span>
          </div>
          <a :href="publicUrl(list.token)" target="_blank" rel="noopener" class="row__link">{{
            publicUrl(list.token)
          }}</a>
        </div>
        <div class="row__actions">
          <button class="btn btn--sm btn--ghost" @click="copy(list.token)">
            <BaseIcon name="share" :size="15" /> Copier
          </button>
          <button class="btn btn--sm btn--danger" aria-label="Supprimer" @click="remove(list)">
            <BaseIcon name="trash" :size="15" />
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.shared {
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
.create {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.create__filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
.create__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  flex-wrap: wrap;
}
.row__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}
.row__filters {
  display: flex;
  gap: var(--space-2);
}
.row__link {
  font-size: var(--text-xs);
  color: var(--text-subtle);
  word-break: break-all;
}
.row__actions {
  display: flex;
  gap: var(--space-2);
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-8);
  color: var(--text-subtle);
}
@media (max-width: 560px) {
  .create__filters {
    grid-template-columns: 1fr;
  }
}
</style>
