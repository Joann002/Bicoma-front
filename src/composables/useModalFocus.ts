import { watch, nextTick, onScopeDispose, type Ref } from 'vue'
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]'
export function useModalFocus(open: Ref<boolean>, panel: Ref<HTMLElement | null>) {
  let previous: HTMLElement | null = null,
    overflow: string | undefined
  function restore() {
    if (overflow !== undefined) {
      document.body.style.overflow = overflow
      overflow = undefined
    }
    previous?.focus()
    previous = null
  }
  function keydown(event: KeyboardEvent) {
    if (!open.value) return
    if (event.key === 'Escape') {
      event.preventDefault()
      open.value = false
      return
    }
    if (event.key !== 'Tab') return
    const controls = [...(panel.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter(
      (el) => el.getClientRects().length > 0,
    )
    const first = controls[0],
      last = controls.at(-1)
    if (!first) {
      event.preventDefault()
      panel.value?.focus()
      return
    }
    if (
      event.shiftKey &&
      (document.activeElement === first || !panel.value?.contains(document.activeElement))
    ) {
      event.preventDefault()
      last?.focus()
    } else if (
      !event.shiftKey &&
      (document.activeElement === last || !panel.value?.contains(document.activeElement))
    ) {
      event.preventDefault()
      first.focus()
    }
  }
  document.addEventListener('keydown', keydown)
  watch(open, async (value) => {
    if (!value) {
      restore()
      return
    }
    previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    if (open.value) (panel.value?.querySelector<HTMLElement>(FOCUSABLE) ?? panel.value)?.focus()
  })
  onScopeDispose(() => {
    document.removeEventListener('keydown', keydown)
    restore()
  })
}
