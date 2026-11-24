<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import ErrorNotice from '@/components/ErrorNotice.vue'
import { useModalFocus } from '@/composables/useModalFocus'
import BaseIcon from '@/components/BaseIcon.vue'

const auth = useAuthStore()
const router = useRouter()
const { theme, toggle } = useTheme()
const mobileOpen = ref(false)
const signingOut = ref(false)
const panel = ref<HTMLElement | null>(null),
  mobile = ref(window.innerWidth <= 860)
useModalFocus(mobileOpen, panel)
watch(
  () => router.currentRoute.value.fullPath,
  () => {
    mobileOpen.value = false
  },
)
function resize() {
  mobile.value = window.innerWidth <= 860
  if (!mobile.value) mobileOpen.value = false
}
window.addEventListener('resize', resize)
import { onScopeDispose } from 'vue'
onScopeDispose(() => window.removeEventListener('resize', resize))

const links = [
  { to: { name: 'shelf' }, icon: 'library', label: 'Étagère' },
  { to: { name: 'import' }, icon: 'search', label: 'Importer' },
  { to: { name: 'loans' }, icon: 'users', label: 'Prêts' },
  { to: { name: 'stats' }, icon: 'chart', label: 'Statistiques' },
  { to: { name: 'recommendations' }, icon: 'sparkles', label: 'Pour vous' },
  { to: { name: 'shared' }, icon: 'share', label: 'Listes partagées' },
] as const

onMounted(() => {
  if (!auth.ready) void auth.fetchMe()
})

async function handleLogout() {
  if (signingOut.value) return
  signingOut.value = true
  try {
    await auth.logout()
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <div class="app">
    <a href="#main-content" class="skip-link">Aller au contenu</a>
    <button
      class="menu-toggle"
      aria-label="Menu"
      aria-controls="main-navigation"
      :aria-expanded="mobileOpen"
      @click="mobileOpen = !mobileOpen"
    >
      <BaseIcon :name="mobileOpen ? 'close' : 'grid'" />
    </button>

    <aside
      id="main-navigation"
      ref="panel"
      class="sidebar"
      tabindex="-1"
      :inert="mobile && !mobileOpen"
      :role="mobile && mobileOpen ? 'dialog' : undefined"
      :aria-modal="mobile && mobileOpen ? true : undefined"
      aria-label="Navigation principale"
      :class="{ 'sidebar--open': mobileOpen }"
    >
      <button
        v-if="mobile && mobileOpen"
        class="btn btn--ghost"
        type="button"
        @click="mobileOpen = false"
      >
        Fermer le menu
      </button>
      <div class="brand">
        <BaseIcon name="library" :size="26" />
        <span>Bicoma</span>
      </div>

      <nav aria-label="Navigation principale" class="nav" @click="mobileOpen = false">
        <RouterLink v-for="l in links" :key="l.label" :to="l.to" class="nav__link">
          <BaseIcon :name="l.icon" :size="18" />
          <span>{{ l.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar__footer">
        <button class="theme-btn" @click="toggle">
          <BaseIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="18" />
          <span>{{ theme === 'dark' ? 'Mode clair' : 'Mode sombre' }}</span>
        </button>
        <div class="user">
          <div class="user__avatar">{{ (auth.user?.name ?? '?').charAt(0).toUpperCase() }}</div>
          <div class="user__meta">
            <strong>{{ auth.user?.name ?? '…' }}</strong>
            <span class="subtle">{{ auth.user?.email }}</span>
          </div>
          <button
            class="icon-btn"
            aria-label="Se déconnecter"
            :disabled="signingOut"
            @click="handleLogout"
          >
            <BaseIcon name="logout" :size="18" />
          </button>
        </div>
      </div>
    </aside>

    <div v-if="mobileOpen" class="scrim" @click="mobileOpen = false" aria-hidden="true"></div>

    <main id="main-content" tabindex="-1" class="content" :inert="mobile && mobileOpen">
      <ErrorNotice v-if="auth.error" :message="auth.error" retry @retry="auth.fetchMe()" />
      <p v-if="auth.volatile" role="status" class="session-note">
        Le stockage est indisponible : cette session sera perdue au rechargement.
      </p>
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100dvh;
}
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--sidebar-w);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-5) var(--space-4);
  background: var(--surface);
  border-right: 1px solid var(--border);
  z-index: var(--z-nav);
}
.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--accent);
  padding: 0 var(--space-2);
}
.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}
.nav__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 44px;
  padding: 0 var(--space-3);
  border-radius: var(--radius);
  color: var(--text-muted);
  font-weight: 500;
  font-size: var(--text-sm);
  transition: all var(--dur) var(--ease-out);
}
.nav__link:hover {
  background: var(--surface-2);
  color: var(--text);
}
.nav__link.router-link-active {
  background: var(--accent-soft);
  color: var(--accent);
}
.sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.theme-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 40px;
  padding: 0 var(--space-3);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-muted);
  font-size: var(--text-sm);
  cursor: pointer;
}
.theme-btn:hover {
  background: var(--surface-2);
}
.user {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius);
  background: var(--surface-2);
}
.user__avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--accent);
  color: var(--accent-contrast);
  font-weight: 700;
  flex-shrink: 0;
}
.user__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  font-size: var(--text-xs);
}
.user__meta strong {
  font-size: var(--text-sm);
}
.user__meta span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.icon-btn {
  margin-left: auto;
  display: flex;
  padding: var(--space-2);
  background: none;
  border: none;
  color: var(--text-subtle);
  cursor: pointer;
  border-radius: var(--radius-sm);
}
.icon-btn:hover {
  color: var(--text);
  background: var(--surface-3);
}
.content {
  margin-left: var(--sidebar-w);
  padding: var(--space-6);
  max-width: var(--content-max);
}
.menu-toggle {
  display: none;
}
.scrim {
  display: none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms var(--ease-out);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 860px) {
  .menu-toggle {
    position: fixed;
    top: var(--space-3);
    right: var(--space-3);
    z-index: var(--z-overlay);
    display: flex;
    padding: var(--space-2);
    background: var(--surface-3);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    color: var(--text);
    cursor: pointer;
  }
  .sidebar {
    transform: translateX(-100%);
    transition: transform var(--dur) var(--ease-out);
  }
  .sidebar--open {
    transform: translateX(0);
    box-shadow: var(--shadow-3);
    z-index: var(--z-overlay);
  }
  .scrim {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: var(--z-nav);
  }
  .content {
    margin-left: 0;
    padding: var(--space-8) var(--space-4) var(--space-5);
  }
}
</style>
