import { describe, expect, it } from 'vitest'
import { formatFriendlyDate, formatMonthLong } from './format'

describe('formatFriendlyDate', () => {
  const ref = new Date(2026, 7, 19)

  it('Hoy y Ayer', () => {
    expect(formatFriendlyDate('2026-08-19', ref)).toBe('Hoy')
    expect(formatFriendlyDate('2026-08-18', ref)).toBe('Ayer')
  })

  it('otros días en español corto', () => {
    const label = formatFriendlyDate('2026-08-10', ref)
    expect(label.toLowerCase()).toContain('ago')
    expect(label).toMatch(/10/)
  })
})

describe('formatMonthLong', () => {
  it('mes y año desde YYYY-MM', () => {
    expect(formatMonthLong('2026-08').toLowerCase()).toContain('agosto')
    expect(formatMonthLong('2026-08')).toContain('2026')
  })
})
