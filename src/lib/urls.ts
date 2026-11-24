export function safeCoverUrl(value: string | null | undefined): string | null {
  if (!value || /[\x00-\x20\\]/.test(value)) return null
  if (value.startsWith('/') && !value.startsWith('//')) return value
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null
  } catch {
    return null
  }
}
