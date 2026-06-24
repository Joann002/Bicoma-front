<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Item } from '@/lib/types'
import { TYPE_LABELS, STATUS_LABELS } from '@/lib/types'
import BaseIcon from '@/components/BaseIcon.vue'
import RatingStars from '@/components/RatingStars.vue'

const props = defineProps<{ item: Item }>()

const typeIcon = computed(
  () => ({ book: 'book', movie: 'film', series: 'tv', game: 'gamepad' })[props.item.type],
)
const initials = computed(() =>
  props.item.title
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase(),
)
</script>

<template>
  <RouterLink :to="{ name: 'item-detail', params: { id: item.id } }" class="item-card">
    <div class="cover" :style="{ '--type-color': `var(--type-${item.type})` }">
      <img
        v-if="item.cover_url"
        :src="item.cover_url"
        :alt="`Couverture de ${item.title}`"
        loading="lazy"
        decoding="async"
        class="cover__img"
      />
      <div v-else class="cover__placeholder">
        <BaseIcon :name="typeIcon" :size="34" />
        <span>{{ initials }}</span>
      </div>

      <span class="cover__type" :title="TYPE_LABELS[item.type]">
        <BaseIcon :name="typeIcon" :size="14" />
      </span>

      <span v-if="item.active_loan" class="cover__loan" :title="`Prêté à ${item.active_loan.borrower_name}`">
        <BaseIcon name="users" :size="13" />
      </span>

      <span class="cover__status" :data-status="item.status">{{ STATUS_LABELS[item.status] }}</span>
    </div>

    <div class="meta">
      <strong class="title">{{ item.title }}</strong>
      <span v-if="item.creator" class="creator subtle">{{ item.creator }}</span>
      <RatingStars v-if="item.rating" :model-value="item.rating" :size="13" />
    </div>
  </RouterLink>
</template>

<style scoped>
.item-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  color: var(--text);
  transition: transform var(--dur) var(--ease-out);
}
.item-card:hover {
  transform: translateY(-4px);
}
.cover {
  position: relative;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface-2);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-1);
}
.item-card:hover .cover {
  box-shadow: var(--shadow-2);
}
.cover__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--type-color, var(--accent));
  background: linear-gradient(160deg, var(--surface-3), var(--surface-2));
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  font-weight: 600;
}
.cover__type {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.55);
  color: var(--type-color, #fff);
  backdrop-filter: blur(4px);
}
.cover__loan {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--terracotta-500);
  color: #fff;
}
.cover__status {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px var(--space-2);
  font-size: var(--text-xs);
  font-weight: 600;
  text-align: center;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  backdrop-filter: blur(4px);
}
.cover__status[data-status='done'] {
  background: rgba(95, 158, 107, 0.85);
}
.cover__status[data-status='in_progress'] {
  background: rgba(216, 151, 60, 0.85);
  color: #1e1812;
}
.cover__status[data-status='wishlist'] {
  background: rgba(91, 134, 179, 0.85);
}
.cover__status[data-status='abandoned'] {
  background: rgba(122, 110, 90, 0.85);
}
.meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.title {
  font-size: var(--text-sm);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.creator {
  font-size: var(--text-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
