<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/lib/api'
import type { Item } from '@/lib/types'
import ItemCard from '@/components/ItemCard.vue'
import BaseIcon from '@/components/BaseIcon.vue'

const loading = ref(true)
const topGenres = ref<string[]>([])
const topCreators = ref<string[]>([])
const suggestions = ref<Item[]>([])

onMounted(async () => {
  try {
    const { data } = await api.get('/recommendations')
    topGenres.value = data.data.top_genres
    topCreators.value = data.data.top_creators
    suggestions.value = data.data.suggestions
  } finally {
    loading.value = false
  }
})

const hasInsights = () => topGenres.value.length || topCreators.value.length
</script>

<template>
  <div class="reco">
    <header>
      <h1>Pour vous</h1>
      <p class="muted">Des suggestions basées sur vos genres et créateurs les mieux notés.</p>
    </header>

    <div v-if="loading" class="muted">Analyse de vos goûts…</div>

    <template v-else>
      <section v-if="hasInsights()" class="insights">
        <div v-if="topGenres.length" class="insight card">
          <h2><BaseIcon name="sparkles" :size="16" /> Vos genres favoris</h2>
          <div class="chips">
            <span v-for="g in topGenres" :key="g" class="tag-chip">{{ g }}</span>
          </div>
        </div>
        <div v-if="topCreators.length" class="insight card">
          <h2><BaseIcon name="star" :size="16" /> Vos créateurs favoris</h2>
          <div class="chips">
            <span v-for="c in topCreators" :key="c" class="tag-chip">{{ c }}</span>
          </div>
        </div>
      </section>

      <section v-if="suggestions.length">
        <h2 class="section-title">À découvrir dans votre wishlist</h2>
        <div class="grid">
          <ItemCard v-for="item in suggestions" :key="item.id" :item="item" />
        </div>
      </section>

      <div v-else class="empty card">
        <BaseIcon name="sparkles" :size="40" />
        <p class="muted">
          Notez quelques titres terminés (4★ et +) et ajoutez des envies à votre wishlist : Bicoma vous
          proposera alors des recommandations personnalisées.
        </p>
        <RouterLink :to="{ name: 'shelf' }" class="btn btn--primary">Voir mon étagère</RouterLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.reco {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
header h1 {
  font-size: var(--text-3xl);
}
.insights {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
.insight {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.insight h2 {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  color: var(--accent);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.section-title {
  font-size: var(--text-xl);
  margin-bottom: var(--space-3);
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
.empty p {
  max-width: 48ch;
}
@media (max-width: 640px) {
  .insights {
    grid-template-columns: 1fr;
  }
}
</style>
