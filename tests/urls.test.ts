import { expect, it } from 'vitest'
import { safeCoverUrl } from '@/lib/urls'
it('permits expected image URLs and rejects executable or credential-bearing sources', () => {
  expect(safeCoverUrl('https://example.test/cover.jpg')).toBe('https://example.test/cover.jpg')
  expect(safeCoverUrl('/cover.jpg')).toBe('/cover.jpg')
  for (const value of [
    'javascript:alert(1)',
    'data:image/svg+xml,test',
    '//evil.test/a',
    'https://a:secret@example.test/a',
    'https://example.test/\nb',
    '\\evil',
    null,
  ])
    expect(safeCoverUrl(value)).toBeNull()
})
