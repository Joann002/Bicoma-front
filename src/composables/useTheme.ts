import { ref } from 'vue'
import { readStorage, writeStorage } from '@/lib/storage'
type Theme = 'dark' | 'light'
const KEY = 'bicoma_theme',
  stored = readStorage(KEY),
  theme = ref<Theme>(stored === 'light' ? 'light' : 'dark')
function apply(value: Theme) {
  if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', value)
}
apply(theme.value)
export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    writeStorage(KEY, theme.value)
    apply(theme.value)
  }
  return { theme, toggle }
}
