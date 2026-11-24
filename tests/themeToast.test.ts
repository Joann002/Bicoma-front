import { afterEach, expect, it, vi } from 'vitest'
import { useToast } from '@/composables/useToast'
afterEach(() => {
  useToast().clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
})
it('bounds toast queues, keeps errors longer and releases dismissed timers', () => {
  vi.useFakeTimers()
  const toast = useToast()
  for (let i = 0; i < 7; i++) toast.error(String(i))
  expect(toast.toasts).toHaveLength(5)
  vi.advanceTimersByTime(4000)
  expect(toast.toasts).toHaveLength(5)
  toast.dismiss(toast.toasts[0]!.id)
  expect(toast.toasts).toHaveLength(4)
  vi.advanceTimersByTime(6000)
  expect(toast.toasts).toEqual([])
})
it('falls back from invalid theme data and remains usable without storage', async () => {
  localStorage.setItem('bicoma_theme', 'invalid')
  vi.resetModules()
  const { useTheme } = await import('@/composables/useTheme')
  const theme = useTheme()
  expect(theme.theme.value).toBe('dark')
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  theme.toggle()
  expect(theme.theme.value).toBe('light')
  expect(document.documentElement.dataset.theme).toBe('light')
})
