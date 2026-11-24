import { beforeEach, expect, it, vi } from 'vitest'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})
function unauthorized(config: InternalAxiosRequestConfig): never {
  throw new AxiosError('expired', 'ERR_BAD_REQUEST', config, undefined, {
    config,
    data: { message: 'expired' },
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
  })
}
it('never attaches a private bearer to a public-list request or logs it out', async () => {
  const { api } = await import('@/lib/api'),
    session = await import('@/lib/session')
  session.setSessionToken('private')
  api.defaults.adapter = async (config) => {
    expect(config.headers.get('Authorization')).toBeUndefined()
    return unauthorized(config)
  }
  await expect(api.get('/public/token')).rejects.toBeDefined()
  expect(session.sessionToken()).toBe('private')
})
it('expires the active session after its own private 401', async () => {
  const { api } = await import('@/lib/api'),
    session = await import('@/lib/session')
  session.setSessionToken('active')
  api.defaults.adapter = async (config) => {
    expect(config.headers.get('Authorization')).toBe('Bearer active')
    return unauthorized(config)
  }
  await expect(api.get('/items')).rejects.toBeDefined()
  expect(session.sessionToken()).toBeNull()
})
it('does not clear a newly logged-in account when an older request fails', async () => {
  const { api } = await import('@/lib/api'),
    session = await import('@/lib/session')
  session.setSessionToken('old')
  api.defaults.adapter = async (config) => {
    session.setSessionToken('new')
    return unauthorized(config)
  }
  await expect(api.get('/items')).rejects.toBeDefined()
  expect(session.sessionToken()).toBe('new')
})
it('preserves a session after a failed login or a transient network error', async () => {
  const { api } = await import('@/lib/api'),
    session = await import('@/lib/session')
  session.setSessionToken('active')
  api.defaults.adapter = async (config) => unauthorized(config)
  await expect(api.post('/login', {})).rejects.toBeDefined()
  expect(session.sessionToken()).toBe('active')
  api.defaults.adapter = async () => {
    throw new Error('offline')
  }
  await expect(api.get('/items')).rejects.toBeDefined()
  expect(session.sessionToken()).toBe('active')
})
