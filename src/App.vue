<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { useSessionLifecycle } from '@/composables/useSessionLifecycle'
import ToastHost from '@/components/ToastHost.vue'
const { version: sessionVersion, authenticated } = useSessionLifecycle()
const route = useRoute()
</script>

<template>
  <RouterView
    v-if="!route.meta.auth || authenticated"
    :key="route.meta.auth ? sessionVersion : undefined"
  />
  <p v-else role="status">Fin de session…</p>
  <ToastHost />
</template>
