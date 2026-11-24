import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { readStorage, writeStorage } from '@/lib/storage'
beforeEach(() => localStorage.clear())
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
it('reads and removes optional persisted values', () => {
  expect(writeStorage('key', 'value')).toBe(true)
  expect(readStorage('key')).toBe('value')
  expect(writeStorage('key', null)).toBe(true)
  expect(readStorage('key')).toBeNull()
})
it('contains storage permission and quota failures', () => {
  vi.stubGlobal('localStorage', {
    getItem() {
      throw new DOMException('denied', 'SecurityError')
    },
    setItem() {
      throw new DOMException('full', 'QuotaExceededError')
    },
    removeItem() {
      throw new Error('blocked')
    },
  })
  expect(readStorage('key')).toBeNull()
  expect(writeStorage('key', 'value')).toBe(false)
  expect(writeStorage('key', null)).toBe(false)
})
