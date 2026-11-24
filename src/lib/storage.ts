/** Browser storage is optional (private mode, sandboxed frames, disabled persistence). */
export function readStorage(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key)
  } catch {
    return null
  }
}
export function writeStorage(key: string, value: string | null): boolean {
  try {
    if (typeof localStorage === 'undefined') return false
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}
