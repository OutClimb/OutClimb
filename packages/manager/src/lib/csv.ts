function escapeCell(value: string): string {
  // Prevent spreadsheet apps from evaluating submitted values as formulas
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value

  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`
  }

  return safe
}

export function toCsv(rows: Array<Array<string>>): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')
}

export function downloadCsv(fileName: string, rows: Array<Array<string>>) {
  // Byte order mark so Excel opens the file as UTF-8
  const blob = new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()

  URL.revokeObjectURL(url)
}
