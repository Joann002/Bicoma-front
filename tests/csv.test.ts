import { afterEach, expect, it, vi } from 'vitest'
import { csvCell, itemsCsv, downloadCsv } from '@/lib/csv'
import { item } from './fixtures'
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
it('quotes delimiters, quotes and newlines and neutralizes spreadsheet formulas', () => {
  expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"')
  for (const value of ['=SUM(A1)', ' +test', '-command', '@call', '\tformula'])
    expect(csvCell(value)).toContain("'")
  expect(csvCell(0)).toBe('"0"')
})
it('exports UTF-8 headers, labels and personal notes without changing items', () => {
  const value = { ...item(1, 'Été'), notes: '=1+1' },
    before = structuredClone(value),
    csv = itemsCsv([value])
  expect(csv.startsWith('\uFEFF')).toBe(true)
  expect(csv).toContain('"Livre"')
  expect(csv).toContain("'=1+1")
  expect(value).toEqual(before)
})
it('downloads only supplied rows and revokes the object URL after the browser starts', () => {
  vi.useFakeTimers()
  const create = vi.fn(() => 'blob:test'),
    revoke = vi.fn()
  vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke })
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  downloadCsv([item()])
  expect(click).toHaveBeenCalledOnce()
  expect(document.querySelector('a[download]')).toBeNull()
  expect(revoke).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1000)
  expect(revoke).toHaveBeenCalledWith('blob:test')
})
