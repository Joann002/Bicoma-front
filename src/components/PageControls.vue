<script setup lang="ts">
defineProps<{ page: number; lastPage: number; loading?: boolean }>()
defineEmits<{ change: [page: number] }>()
</script>
<template>
  <nav v-if="lastPage > 1" class="page-controls" aria-label="Pagination">
    <button
      type="button"
      class="btn btn--sm"
      :disabled="loading || page <= 1"
      @click="$emit('change', page - 1)"
    >
      Précédent</button
    ><span role="status" aria-live="polite">Page {{ page }} / {{ lastPage }}</span
    ><button
      type="button"
      class="btn btn--sm"
      :disabled="loading || page >= lastPage"
      @click="$emit('change', page + 1)"
    >
      Suivant
    </button>
  </nav>
</template>
<style scoped>
.page-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
}
</style>
