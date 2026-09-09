import { describe, expect, it } from 'vitest'

import { addCalendarMonths } from '@/utils/date'

describe('달력 월 단위 계산', () => {
  it('월말 보정 뒤에도 원래 기준일을 유지한다', () => {
    const april = addCalendarMonths('2026-01-31', 3, 31)
    const july = addCalendarMonths(april, 3, 31)
    const october = addCalendarMonths(july, 3, 31)

    expect(april).toBe('2026-04-30')
    expect(july).toBe('2026-07-31')
    expect(october).toBe('2026-10-31')
  })

  it('31일이 없는 2월은 말일로 보정한다', () => {
    expect(addCalendarMonths('2026-08-31', 6, 31)).toBe('2027-02-28')
  })

  it('윤년 2월 29일을 보존한다', () => {
    expect(addCalendarMonths('2024-02-29', 12, 29)).toBe('2025-02-28')
    expect(addCalendarMonths('2025-02-28', 12, 29)).toBe('2026-02-28')
    expect(addCalendarMonths('2026-02-28', 24, 29)).toBe('2028-02-29')
  })
})
