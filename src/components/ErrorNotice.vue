<script setup lang="ts">
defineProps<{ message: string; retry?: boolean }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <div class="error-notice" role="alert">
    <p>{{ message }}</p>
    <button v-if="retry" type="button" class="btn btn--sm btn--ghost" @click="$emit('retry')">
      Réessayer
    </button>
  </div>
</template>
<style scoped>
.error-notice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--danger);
  border-radius: var(--radius);
  color: var(--danger);
}
.error-notice p {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
