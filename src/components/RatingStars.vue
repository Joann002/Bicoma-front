<script setup lang="ts">
import { computed } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'

const props = withDefaults(
  defineProps<{ modelValue: number | null; editable?: boolean; size?: number }>(),
  { editable: false, size: 16 },
)
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const stars = [1, 2, 3, 4, 5]
const value = computed(() => props.modelValue ?? 0)

function set(n: number) {
  if (!props.editable) return
  emit('update:modelValue', props.modelValue === n ? null : n)
}
</script>

<template>
  <div class="rating" :class="{ 'rating--editable': editable }" role="img"
    :aria-label="modelValue ? `${modelValue} sur 5` : 'Non noté'">
    <button
      v-for="n in stars"
      :key="n"
      type="button"
      class="star"
      :class="{ 'star--on': n <= value }"
      :tabindex="editable ? 0 : -1"
      :aria-label="`Noter ${n}`"
      @click="set(n)"
    >
      <BaseIcon name="star" :size="size" />
    </button>
  </div>
</template>

<style scoped>
.rating {
  display: inline-flex;
  gap: 1px;
}
.star {
  background: none;
  border: none;
  padding: 0;
  color: var(--border-strong);
  cursor: default;
  display: flex;
}
.rating--editable .star {
  cursor: pointer;
  padding: 2px;
}
.star--on {
  color: var(--accent);
}
.star--on :deep(svg) {
  fill: var(--accent);
}
</style>
