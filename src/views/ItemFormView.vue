<script setup lang="ts">
import { computed, reactive, ref, watch, onScopeDispose } from 'vue'
import {
  useRoute,
  useRouter,
  RouterLink,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
} from 'vue-router'
import { useItemsStore } from '@/stores/items'
import { useToast } from '@/composables/useToast'
import { TYPE_LABELS, STATUS_LABELS } from '@/lib/types'
import type { ItemType, ItemStatus } from '@/lib/types'
import { latestRequest } from '@/lib/latestRequest'
import { errorMessage, isCancelled, validationErrors } from '@/lib/errors'
import { positiveInteger } from '@/lib/itemQuery'
import { safeCoverUrl } from '@/lib/urls'
import ErrorNotice from '@/components/ErrorNotice.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import RatingStars from '@/components/RatingStars.vue'
const route = useRoute(),
  router = useRouter(),
  store = useItemsStore(),
  toast = useToast(),
  requests = latestRequest()
const editingId = computed(() =>
  route.name === 'item-edit' ? positiveInteger(route.params.id, 0) : null,
)
const loading = ref(false),
  pageLoading = ref(false),
  loadError = ref<string | null>(null),
  saveError = ref<string | null>(null),
  errors = ref<Record<string, string[]>>({}),
  baseline = ref('')
const types: ItemType[] = ['book', 'movie', 'series', 'game'],
  statuses: ItemStatus[] = ['wishlist', 'in_progress', 'done', 'abandoned']
const text = (value: unknown) => (typeof value === 'string' ? value : '')
function defaults() {
  return {
    type: types.includes(route.query.type as ItemType)
      ? (route.query.type as ItemType)
      : ('book' as ItemType),
    title: text(route.query.title),
    creator: text(route.query.creator),
    cover_url: safeCoverUrl(text(route.query.cover_url)) ?? '',
    status: 'wishlist' as ItemStatus,
    rating: null as number | null,
    genre: text(route.query.genre),
    synopsis: text(route.query.synopsis),
    notes: '',
    external_id: text(route.query.external_id),
    external_source: text(route.query.external_source),
    finished_at: '',
    tagsInput: '',
  }
}
const form = reactive(defaults()),
  dirty = computed(
    () => !pageLoading.value && !loadError.value && JSON.stringify(form) !== baseline.value,
  )
let alive = true
async function load() {
  const request = requests.start()
  loadError.value = null
  saveError.value = null
  errors.value = {}
  Object.assign(form, defaults())
  baseline.value = JSON.stringify(form)
  if (editingId.value === null) {
    pageLoading.value = false
    return
  }
  pageLoading.value = true
  try {
    if (!editingId.value) throw new Error('Identifiant invalide.')
    const item = await store.get(editingId.value, request.signal)
    if (!request.current()) return
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
      finished_at: item.finished_at?.slice(0, 10) ?? '',
      tagsInput: (item.tags ?? []).join(', '),
    })
    baseline.value = JSON.stringify(form)
  } catch (cause) {
    if (request.current() && !isCancelled(cause)) loadError.value = errorMessage(cause)
  } finally {
    if (request.current()) pageLoading.value = false
  }
}
async function submit() {
  if (loading.value || pageLoading.value) return
  errors.value = {}
  saveError.value = null
  if (!form.title.trim()) {
    errors.value.title = ['Le titre est obligatoire.']
    return
  }
  if (form.cover_url && !safeCoverUrl(form.cover_url)) {
    errors.value.cover_url = ['Utilisez une URL HTTP ou HTTPS sans identifiants.']
    saveError.value = errors.value.cover_url[0] ?? null
    return
  }
  loading.value = true
  const payload = {
    type: form.type,
    title: form.title.trim(),
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
    tags: [
      ...new Set(
        form.tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ],
  }
  try {
    const item = editingId.value
      ? await store.update(editingId.value, payload)
      : await store.create(payload)
    if (!alive) return
    baseline.value = JSON.stringify(form)
    toast.success(editingId.value ? 'Élément mis à jour' : 'Élément ajouté')
    void router.push({ name: 'item-detail', params: { id: item.id } })
  } catch (cause) {
    if (alive) {
      errors.value = validationErrors(cause)
      saveError.value = errorMessage(cause)
    }
  } finally {
    if (alive) loading.value = false
  }
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
window.addEventListener('beforeunload', beforeUnload)
const mayLeave = () => !dirty.value || confirm('Quitter sans enregistrer vos modifications ?')
onBeforeRouteLeave(mayLeave)
onBeforeRouteUpdate(mayLeave)
watch(
  () => route.fullPath,
  () => {
    void load()
  },
  { immediate: true },
)
onScopeDispose(() => {
  alive = false
  requests.cancel()
  window.removeEventListener('beforeunload', beforeUnload)
})
</script>

<template>
  <div class="form-page">
    <RouterLink :to="{ name: 'shelf' }" class="back">
      <BaseIcon name="back" :size="18" /> Retour
    </RouterLink>
    <h1>{{ editingId ? 'Modifier' : 'Ajouter' }} un élément</h1>

    <p v-if="pageLoading" role="status">Chargement de l’élément…</p>
    <ErrorNotice v-else-if="loadError" :message="loadError" retry @retry="load" />
    <form v-else class="card form" @submit.prevent="submit" :aria-busy="loading">
      <ErrorNotice v-if="saveError" :message="saveError" />
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
        <input
          id="cover"
          v-model="form.cover_url"
          class="input"
          type="url"
          placeholder="https://…"
        />
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
