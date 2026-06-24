import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, setToken, getStoredToken } from '@/lib/api'
import type { User } from '@/lib/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const ready = ref(false)

  function isAuthenticated() {
    return !!getStoredToken()
  }

  async function login(email: string, password: string) {
    const { data } = await api.post('/login', { email, password })
    setToken(data.token)
    user.value = data.user
  }

  async function register(payload: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }) {
    const { data } = await api.post('/register', payload)
    setToken(data.token)
    user.value = data.user
  }

  async function fetchMe() {
    if (!getStoredToken()) {
      ready.value = true
      return
    }
    try {
      const { data } = await api.get('/me')
      user.value = data.user
    } catch {
      user.value = null
    } finally {
      ready.value = true
    }
  }

  async function logout() {
    try {
      await api.post('/logout')
    } catch {
      // on ignore : on déconnecte localement de toute façon
    }
    setToken(null)
    user.value = null
  }

  return { user, ready, isAuthenticated, login, register, fetchMe, logout }
})
