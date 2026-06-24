<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useItemsStore } from '@/stores/items'
import { useToast } from '@/composables/useToast'
import { TYPE_LABELS, STATUS_LABELS } from '@/lib/types'
import type { ItemType, ItemStatus } from '@/lib/types'
import BaseIcon from '@/components/BaseIcon.vue'
import RatingStars from '@/components/RatingStars.vue'
import { AxiosError } from 'axios'

const route = useRoute()
const router = useRouter()
const store = useItemsStore()
const toast = useToast()

const editingId = computed(() => (route.name === 'item-edit' ? Number(route.params.id) : null))
const loading = ref(false)
const errors = ref<Record<string, string[]>>({})

const form = reactive({
  type: (route.query.type as ItemType) || ('book' as ItemType),
  title: (route.query.title as string) || '',
  creator: (route.query.creator as string) || '',
  cover_url: (route.query.cover_url as string) || '',
  status: 'wishlist' as ItemStatus,
  rating: null as number | null,
  genre: (route.query.genre as string) || '',
  synopsis: (route.query.synopsis as string) || '',
  notes: '',
  external_id: (route.query.external_id as string) || '',
  external_source: (route.query.external_source as string) || '',
  finished_at: '',
  tagsInput: '',
})

const types: ItemType[] = ['book', 'movie', 'series', 'game']
const statuses: ItemStatus[] = ['wishlist', 'in_progress', 'done', 'abandoned']

onMounted(async () => {
  if (editingId.value) {
    const item = await store.get(editingId.value)
    Object.assign(form, {
      type: item.type,
      title: item.title,
      creator: item.creator ?? '',
      cover_url: item.cover_url ?? '',
      status: item.status,
      rating: item.rating,
      genre: item.genre ?? '',
      synopsis: item.synopsis ?? '',
      notes: item.notes ?? '',
      external_id: item.external_id ?? '',
      external_source: item.external_source ?? '',
      finished_at: item.finished_at ? item.finished_at.slice(0, 10) : '',
      tagsInput: (item.tags ?? []).join(', '),
    })
  }
})

async function submit() {
  errors.value = {}
  loading.value = true
  const payload = {
    type: form.type,
    title: form.title,
    creator: form.creator || null,
    cover_url: form.cover_url || null,
    status: form.status,
    rating: form.rating,
    genre: form.genre || null,
    synopsis: form.synopsis || null,
    notes: form.notes || null,
    external_id: form.external_id || null,
    external_source: form.external_source || null,
    finished_at: form.finished_at || null,
    tags: form.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  }
  try {
    const item = editingId.value
      ? await store.update(editingId.value, payload)
      : await store.create(payload)
    toast.success(editingId.value ? 'Élément mis à jour' : 'Élément ajouté')
    router.push({ name: 'item-detail', params: { id: item.id } })
  } catch (e) {
    const err = e as AxiosError<{ errors?: Record<string, string[]> }>
    errors.value = err.response?.data?.errors ?? {}
    toast.error('Vérifiez le formulaire.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="form-page">
    <RouterLink :to="{ name: 'shelf' }" class="back">
      <BaseIcon name="back" :size="18" /> Retour
    </RouterLink>
    <h1>{{ editingId ? 'Modifier' : 'Ajouter' }} un élément</h1>

    <form class="card form" @submit.prevent="submit" novalidate>
      <div class="row">
        <div class="field">
          <label for="type">Type</label>
          <select id="type" v-model="form.type" class="select">
            <option v-for="t in types" :key="t" :value="t">{{ TYPE_LABELS[t] }}</option>
          </select>
        </div>
        <div class="field">
          <label for="status">Statut</label>
          <select id="status" v-model="form.status" class="select">
            <option v-for="s in statuses" :key="s" :value="s">{{ STATUS_LABELS[s] }}</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label for="title">Titre *</label>
        <input id="title" v-model="form.title" class="input" required />
        <span v-if="errors.title" class="field-error">{{ errors.title[0] }}</span>
      </div>

      <div class="row">
        <div class="field">
          <label for="creator">Créateur (auteur, réalisateur, studio…)</label>
          <input id="creator" v-model="form.creator" class="input" />
        </div>
        <div class="field">
          <label for="genre">Genre</label>
          <input id="genre" v-model="form.genre" class="input" />
        </div>
      </div>

      <div class="field">
        <label for="cover">URL de couverture</label>
        <input id="cover" v-model="form.cover_url" class="input" type="url" placeholder="https://…" />
      </div>

      <div class="row">
        <div class="field">
          <label>Note</label>
          <RatingStars v-model="form.rating" editable :size="24" />
        </div>
        <div class="field">
          <label for="finished">Terminé le</label>
          <input id="finished" v-model="form.finished_at" class="input" type="date" />
        </div>
      </div>

      <div class="field">
        <label for="tags">Tags (séparés par des virgules)</label>
        <input id="tags" v-model="form.tagsInput" class="input" placeholder="favori, à relire…" />
      </div>

      <div class="field">
        <label for="synopsis">Synopsis</label>
        <textarea id="synopsis" v-model="form.synopsis" class="textarea"></textarea>
      </div>

      <div class="field">
        <label for="notes">Notes personnelles</label>
        <textarea id="notes" v-model="form.notes" class="textarea"></textarea>
      </div>

      <div class="form__actions">
        <RouterLink :to="{ name: 'shelf' }" class="btn btn--ghost">Annuler</RouterLink>
        <button class="btn btn--primary" type="submit" :disabled="loading">
          {{ loading ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-page {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-muted);
  font-size: var(--text-sm);
}
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
}
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
.form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
@media (max-width: 620px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
