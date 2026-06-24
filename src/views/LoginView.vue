<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import BaseIcon from '@/components/BaseIcon.vue'
import { AxiosError } from 'axios'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    toast.success('Bon retour !')
    router.push({ name: 'shelf' })
  } catch (e) {
    const err = e as AxiosError<{ message?: string }>
    error.value = err.response?.data?.message ?? 'Connexion impossible. Vérifiez vos identifiants.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth">
    <div class="auth__card card">
      <div class="auth__brand">
        <BaseIcon name="library" :size="30" />
        <span>Bicoma</span>
      </div>
      <h1>Votre collection vous attend</h1>
      <p class="muted">Connectez-vous pour retrouver vos livres, films, séries et jeux.</p>

      <form @submit.prevent="submit" novalidate>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" class="input" type="email" autocomplete="email" required />
        </div>
        <div class="field">
          <label for="password">Mot de passe</label>
          <input
            id="password"
            v-model="password"
            class="input"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>
        <p v-if="error" class="field-error" role="alert">{{ error }}</p>
        <button class="btn btn--primary" type="submit" :disabled="loading">
          {{ loading ? 'Connexion…' : 'Se connecter' }}
        </button>
      </form>

      <p class="auth__switch muted">
        Pas encore de compte ?
        <RouterLink :to="{ name: 'register' }">Créer un compte</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background:
    radial-gradient(1200px 600px at 70% -10%, var(--accent-soft), transparent),
    var(--bg);
}
.auth__card {
  width: 100%;
  max-width: 420px;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.auth__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--accent);
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  font-weight: 600;
}
.auth__card h1 {
  font-size: var(--text-2xl);
  margin-top: var(--space-2);
}
form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-3);
}
.btn--primary {
  min-height: 48px;
}
.auth__switch {
  text-align: center;
  font-size: var(--text-sm);
  margin-top: var(--space-2);
}
</style>
