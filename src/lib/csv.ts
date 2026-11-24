import type { Item } from './types'
import { TYPE_LABELS, STATUS_LABELS } from './types'
export function csvCell(value: unknown): string {
  let text = value == null ? '' : String(value)
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text
  return '"' + text.replaceAll('"', '""') + '"'
}
export function itemsCsv(items: Item[]): string {
  const rows: unknown[][] = [
    ['Titre', 'Type', 'Créateur', 'Statut', 'Note', 'Tags', 'Terminé le', 'Notes'],
  ]
  for (const item of items)
    rows.push([
      item.title,
      TYPE_LABELS[item.type],
      item.creator,
      STATUS_LABELS[item.status],
      item.rating,
      item.tags?.join(', '),
      item.finished_at,
      item.notes,
    ])
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
export function downloadCsv(items: Item[]) {
  const url = URL.createObjectURL(new Blob([itemsCsv(items)], { type: 'text/csv;charset=utf-8' })),
    link = document.createElement('a')
  link.href = url
  link.download = 'bicoma-page-affichee.csv'
  try {
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
