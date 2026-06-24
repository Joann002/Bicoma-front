import { ref } from 'vue'

type Theme = 'dark' | 'light'
const THEME_KEY = 'bicoma_theme'

const theme = ref<Theme>((localStorage.getItem(THEME_KEY) as Theme) ?? 'dark')

function apply(value: Theme) {
  document.documentElement.setAttribute('data-theme', value)
}

apply(theme.value)

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, theme.value)
    apply(theme.value)
  }
  return { theme, toggle }
}
