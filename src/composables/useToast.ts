import { reactive } from 'vue'
export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}
const state = reactive<{ toasts: Toast[] }>({ toasts: [] }),
  timers = new Map<number, ReturnType<typeof setTimeout>>()
let counter = 0
function dismiss(id: number) {
  clearTimeout(timers.get(id))
  timers.delete(id)
  const index = state.toasts.findIndex((toast) => toast.id === id)
  if (index !== -1) state.toasts.splice(index, 1)
}
function clear() {
  for (const toast of [...state.toasts]) dismiss(toast.id)
}
export function useToast() {
  function push(message: string, type: Toast['type'] = 'info') {
    const id = ++counter
    if (state.toasts.length >= 5) dismiss(state.toasts[0]!.id)
    state.toasts.push({ id, message, type })
    timers.set(
      id,
      setTimeout(() => dismiss(id), type === 'error' ? 10000 : 4000),
    )
  }
  return {
    toasts: state.toasts,
    success: (message: string) => push(message, 'success'),
    error: (message: string) => push(message, 'error'),
    info: (message: string) => push(message, 'info'),
    dismiss,
    clear,
  }
}
