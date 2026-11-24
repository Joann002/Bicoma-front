import { onScopeDispose, ref } from 'vue'
import { useRouter } from 'vue-router'
import { onSessionChange, acceptStorageChange, sessionEpoch, sessionToken } from '@/lib/session'
import { safeRedirect } from '@/lib/itemQuery'
import { useAuthStore } from '@/stores/auth'
import { useItemsStore } from '@/stores/items'
import { useTagsStore } from '@/stores/tags'
import { useLoansStore } from '@/stores/loans'
import { useStatsStore } from '@/stores/stats'
import { useToast } from './useToast'
export function useSessionLifecycle() {
  const version = ref(sessionEpoch()),
    authenticated = ref(Boolean(sessionToken()))
  const router = useRouter(),
    auth = useAuthStore(),
    items = useItemsStore(),
    tags = useTagsStore(),
    loans = useLoansStore(),
    stats = useStatsStore(),
    toast = useToast()
  const stop = onSessionChange((change) => {
    version.value = sessionEpoch()
    authenticated.value = Boolean(change.token)
    auth.clearUser()
    items.reset()
    tags.reset()
    loans.reset()
    stats.reset()
    toast.clear()
    if (!change.token && router.currentRoute.value.meta.auth) {
      const next = safeRedirect(router.currentRoute.value.fullPath)
      void router.replace({ name: 'login', query: next === '/' ? {} : { next } })
    }
    if (change.token && change.source === 'storage') void auth.fetchMe()
  })
  window.addEventListener('storage', acceptStorageChange)
  onScopeDispose(() => {
    stop()
    window.removeEventListener('storage', acceptStorageChange)
  })
  return { version, authenticated }
}
