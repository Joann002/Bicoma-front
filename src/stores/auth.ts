import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, setToken, getStoredToken } from '@/lib/api'
import type { User } from '@/lib/types'
import { latestRequest } from '@/lib/latestRequest'
import { errorMessage, isCancelled } from '@/lib/errors'
import { sessionIsPersistent } from '@/lib/session'
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null),
    ready = ref(false),
    error = ref<string | null>(null),
    volatile = ref(false),
    profile = latestRequest()
  let attempt = 0
  function clearUser() {
    profile.cancel()
    user.value = null
    ready.value = true
    error.value = null
    volatile.value = !sessionIsPersistent()
  }
  function isAuthenticated() {
    return !!getStoredToken()
  }
  async function authenticate(url: string, payload: unknown) {
    const revision = ++attempt
    const { data } = await api.post(url, payload)
    if (revision !== attempt) return
    if (typeof data.token !== 'string' || !data.token || !data.user)
      throw new Error('La réponse de connexion est invalide.')
    setToken(data.token)
    user.value = data.user
    ready.value = true
    error.value = null
    volatile.value = !sessionIsPersistent()
  }
  const login = (email: string, password: string) => authenticate('/login', { email, password })
  const register = (payload: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }) => authenticate('/register', payload)
  async function fetchMe() {
    const token = getStoredToken()
    if (!token) {
      clearUser()
      return false
    }
    const request = profile.start()
    error.value = null
    try {
      const { data } = await api.get('/me', { signal: request.signal })
      if (!request.current() || getStoredToken() !== token) return false
      user.value = data.user
      return true
    } catch (cause) {
      if (request.current() && !isCancelled(cause)) error.value = errorMessage(cause)
      return false
    } finally {
      if (request.current()) ready.value = true
    }
  }
  async function logout() {
    const token = getStoredToken()
    ++attempt
    let revoked = true
    try {
      await api.post('/logout')
    } catch {
      revoked = false
      /* Local sign-out remains possible while offline. */
    }
    if (getStoredToken() === token) {
      setToken(null)
      clearUser()
    }
    return revoked
  }
  return {
    user,
    ready,
    error,
    volatile,
    isAuthenticated,
    login,
    register,
    fetchMe,
    logout,
    clearUser,
  }
})
