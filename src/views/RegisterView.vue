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

const form = ref({ name: '', email: '', password: '', password_confirmation: '' })
const loading = ref(false)
const errors = ref<Record<string, string[]>>({})

async function submit() {
  errors.value = {}
  loading.value = true
  try {
    await auth.register(form.value)
    toast.success('Compte créé. Bienvenue !')
    router.push({ name: 'shelf' })
  } catch (e) {
    const err = e as AxiosError<{ errors?: Record<string, string[]>; message?: string }>
    errors.value = err.response?.data?.errors ?? {}
    if (!Object.keys(errors.value).length) {
      toast.error(err.response?.data?.message ?? 'Inscription impossible.')
    }
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
      <h1>Créer votre bibliothèque</h1>
      <p class="muted">Quelques secondes et votre étagère est prête.</p>

      <form @submit.prevent="submit" novalidate>
        <div class="field">
          <label for="name">Nom</label>
          <input id="name" v-model="form.name" class="input" type="text" autocomplete="name" required />
          <span v-if="errors.name" class="field-error">{{ errors.name[0] }}</span>
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="form.email" class="input" type="email" autocomplete="email" required />
          <span v-if="errors.email" class="field-error">{{ errors.email[0] }}</span>
        </div>
        <div class="field">
          <label for="password">Mot de passe</label>
          <input
            id="password"
            v-model="form.password"
            class="input"
            type="password"
            autocomplete="new-password"
            required
          />
          <span v-if="errors.password" class="field-error">{{ errors.password[0] }}</span>
        </div>
        <div class="field">
          <label for="confirm">Confirmer le mot de passe</label>
          <input
            id="confirm"
            v-model="form.password_confirmation"
            class="input"
            type="password"
            autocomplete="new-password"
            required
          />
        </div>
        <button class="btn btn--primary" type="submit" :disabled="loading">
          {{ loading ? 'Création…' : 'Créer mon compte' }}
        </button>
      </form>

      <p class="auth__switch muted">
        Déjà inscrit ?
        <RouterLink :to="{ name: 'login' }">Se connecter</RouterLink>
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
