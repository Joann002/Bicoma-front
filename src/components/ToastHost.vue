<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import BaseIcon from '@/components/BaseIcon.vue'

const { toasts, dismiss } = useToast()
const icons = { success: 'check', error: 'close', info: 'sparkles' } as const
</script>

<template>
  <div class="toast-host" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="`toast--${t.type}`"
        :role="t.type === 'error' ? 'alert' : 'status'"
      >
        <BaseIcon :name="icons[t.type]" :size="16" />
        <span>{{ t.message }}</span>
        <button class="toast__close" aria-label="Fermer" @click="dismiss(t.id)">
          <BaseIcon name="close" :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  z-index: var(--z-toast);
}
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius);
  box-shadow: var(--shadow-3);
  max-width: min(340px, calc(100vw - 32px));
  overflow-wrap: anywhere;
  font-size: var(--text-sm);
}
.toast--success {
  border-left-color: var(--success);
}
.toast--error {
  border-left-color: var(--danger);
}
.toast__close {
  flex-shrink: 0;
  min-width: 28px;
  min-height: 28px;
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-subtle);
  cursor: pointer;
  display: flex;
}
.toast-enter-active,
.toast-leave-active {
  transition: all var(--dur) var(--ease-out);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
