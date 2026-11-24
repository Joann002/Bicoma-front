<script setup lang="ts">
import { computed } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'
const props = withDefaults(
  defineProps<{ modelValue: number | null; editable?: boolean; size?: number }>(),
  { editable: false, size: 16 },
)
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()
const stars = [1, 2, 3, 4, 5],
  value = computed(() => props.modelValue ?? 0)
function set(n: number) {
  if (props.editable) emit('update:modelValue', props.modelValue === n ? null : n)
}
function keyboard(event: KeyboardEvent, n: number) {
  const offset =
    event.key === 'ArrowRight' || event.key === 'ArrowUp'
      ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
        ? -1
        : 0
  if (!offset) return
  event.preventDefault()
  const next = Math.max(1, Math.min(5, n + offset))
  emit('update:modelValue', next)
  ;(event.currentTarget as HTMLElement).parentElement
    ?.querySelector<HTMLButtonElement>(`[data-star="${next}"]`)
    ?.focus()
}
</script>
<template>
  <div
    class="rating"
    :class="{ 'rating--editable': editable }"
    :role="editable ? 'radiogroup' : 'img'"
    :aria-label="editable ? 'Note' : modelValue ? `${modelValue} sur 5` : 'Non noté'"
  >
    <template v-if="editable"
      ><button
        v-for="n in stars"
        :key="n"
        type="button"
        class="star"
        role="radio"
        :data-star="n"
        :aria-checked="modelValue === n"
        :class="{ 'star--on': n <= value }"
        :tabindex="n === (modelValue ?? 1) ? 0 : -1"
        :aria-label="`Noter ${n} sur 5`"
        @click="set(n)"
        @keydown="keyboard($event, n)"
      >
        <BaseIcon name="star" :size="size" /></button
      ><button
        v-if="modelValue !== null"
        type="button"
        class="clear-rating"
        @click="emit('update:modelValue', null)"
      >
        Effacer la note
      </button></template
    >
    <template v-else
      ><span
        v-for="n in stars"
        :key="n"
        class="star"
        :class="{ 'star--on': n <= value }"
        aria-hidden="true"
        ><BaseIcon name="star" :size="size" /></span
    ></template>
  </div>
</template>
<style scoped>
.rating {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
}
.star {
  display: flex;
  background: none;
  border: none;
  padding: 0;
  color: var(--border-strong);
}
.rating--editable .star {
  padding: 5px;
  cursor: pointer;
}
.star--on {
  color: var(--accent);
}
.star--on :deep(svg) {
  fill: var(--accent);
}
.clear-rating {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: var(--text-xs);
  text-decoration: underline;
  cursor: pointer;
}
</style>
