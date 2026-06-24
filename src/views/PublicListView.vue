<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/lib/api'
import type { Item } from '@/lib/types'
import ItemCard from '@/components/ItemCard.vue'
import BaseIcon from '@/components/BaseIcon.vue'

const route = useRoute()
const loading = ref(true)
const notFound = ref(false)
const title = ref('')
const owner = ref('')
const items = ref<Item[]>([])

onMounted(async () => {
  try {
    const { data } = await api.get(`/public/${route.params.token}`)
    title.value = data.data.title
    owner.value = data.data.owner
    items.value = data.data.items
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})
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
      <div v-if="loading" class="muted">Chargement…</div>

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
          <ItemCard v-for="item in items" :key="item.id" :item="item" />
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
