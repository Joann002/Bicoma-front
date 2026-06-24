import { reactive } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const state = reactive<{ toasts: Toast[] }>({ toasts: [] })
let counter = 0

export function useToast() {
  function push(message: string, type: Toast['type'] = 'info') {
    const id = ++counter
    state.toasts.push({ id, message, type })
    setTimeout(() => dismiss(id), 4000)
  }

  function dismiss(id: number) {
    const i = state.toasts.findIndex((t) => t.id === id)
    if (i !== -1) state.toasts.splice(i, 1)
  }

  return {
    toasts: state.toasts,
    success: (m: string) => push(m, 'success'),
    error: (m: string) => push(m, 'error'),
    info: (m: string) => push(m, 'info'),
    dismiss,
  }
}
