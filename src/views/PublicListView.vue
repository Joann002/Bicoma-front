<script setup lang="ts">
import { ref, watch, onScopeDispose } from 'vue'
import { useRoute } from 'vue-router'
import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import { latestRequest } from '@/lib/latestRequest'
import { errorMessage, isCancelled } from '@/lib/errors'
import type { Item } from '@/lib/types'
import ItemCard from '@/components/ItemCard.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import ErrorNotice from '@/components/ErrorNotice.vue'
const route = useRoute(),
  requests = latestRequest(),
  loading = ref(true),
  notFound = ref(false),
  error = ref<string | null>(null),
  title = ref(''),
  owner = ref(''),
  items = ref<Item[]>([])
async function load() {
  const request = requests.start()
  loading.value = true
  notFound.value = false
  error.value = null
  items.value = []
  title.value = ''
  owner.value = ''
  try {
    const token = String(route.params.token ?? '')
    if (!token || token.length > 200) {
      notFound.value = true
      return
    }
    const { data } = await api.get(`/public/${encodeURIComponent(token)}`, {
      signal: request.signal,
    })
    if (!request.current()) return
    if (!data.data || !Array.isArray(data.data.items))
      throw new Error('La réponse de la liste est invalide.')
    title.value = data.data.title
    owner.value = data.data.owner
    items.value = data.data.items
  } catch (cause) {
    if (request.current() && !isCancelled(cause)) {
      if (isAxiosError(cause) && cause.response?.status === 404) notFound.value = true
      else if (isAxiosError(cause) && [401, 403].includes(cause.response?.status ?? 0))
        error.value = 'Cette liste n’est pas accessible avec ce lien.'
      else error.value = errorMessage(cause)
    }
  } finally {
    if (request.current()) loading.value = false
  }
}
watch(
  () => route.params.token,
  () => {
    void load()
  },
  { immediate: true },
)
onScopeDispose(requests.cancel)
</script>

<template>
  <div class="public">
    <header class="public__head">
      <div class="brand">
        <BaseIcon name="library" :size="24" />
        <span>Bicoma</span>
      </div>
    </header>

    <main class="public__body">
      <div v-if="loading" class="muted" role="status">Chargement…</div>

      <ErrorNotice v-else-if="error" :message="error" retry @retry="load" />
      <div v-else-if="notFound" class="empty">
        <BaseIcon name="close" :size="48" />
        <h1>Liste introuvable</h1>
        <p class="muted">Ce lien n'existe pas ou n'est plus actif.</p>
      </div>

      <template v-else>
        <div class="public__title">
          <h1>{{ title }}</h1>
          <p class="muted">Une sélection partagée par {{ owner }} · {{ items.length }} titres</p>
        </div>

        <div v-if="items.length" class="grid">
          <ItemCard v-for="item in items" :key="item.id" :item="item" read-only />
        </div>
        <p v-else class="muted">Cette liste est vide.</p>
      </template>
    </main>

    <footer class="public__footer subtle">
      Propulsé par Bicoma — votre gestionnaire de collection
    </footer>
  </div>
</template>

<style scoped>
.public {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
.public__head {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--border);
}
.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--accent);
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: 600;
}
.public__body {
  flex: 1;
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.public__title h1 {
  font-size: var(--text-3xl);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-4);
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
  padding: var(--space-8);
  color: var(--text-subtle);
}
.public__footer {
  padding: var(--space-4);
  text-align: center;
  font-size: var(--text-xs);
  border-top: 1px solid var(--border);
}
</style>
