import axios from 'axios'
import { sessionToken, setSessionToken, expireSession } from './session'
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  timeout: 20000,
  headers: { Accept: 'application/json' },
})
export const getStoredToken = sessionToken
export const setToken = setSessionToken
const requestTokens = new WeakMap<object, string | null>()
export function publicEndpoint(url: string | undefined): boolean {
  return /^\/public\//.test(url ?? '')
}
api.interceptors.request.use((config) => {
  const token = publicEndpoint(config.url) ? null : sessionToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  else config.headers.delete('Authorization')
  requestTokens.set(config, token)
  return config
})
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config
    if (
      error.response?.status === 401 &&
      config &&
      !publicEndpoint(config.url) &&
      !/^\/(?:login|register)$/.test(config.url ?? '')
    )
      expireSession(requestTokens.get(config) ?? null)
    return Promise.reject(error)
  },
)
