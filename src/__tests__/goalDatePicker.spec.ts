import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import GoalDatePicker from '@/components/common/goal-date-picker.vue'

afterEach(() => {
  vi.useRealTimers()
})

describe('목표 달성 예정일 선택', () => {
  it('YYYY.MM.DD 직접 입력을 받고 오늘 이전 날짜는 거부한다', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 7, 12))
    const wrapper = mount(GoalDatePicker, { props: { modelValue: '2026-10-07' } })
    const input = wrapper.get('input[aria-label="목표 달성 예정일"]')

    expect((input.element as HTMLInputElement).value).toBe('2026.10.07')

    await input.setValue('20260907')
    expect(wrapper.text()).toContain('오늘 이후 날짜를 입력해 주세요.')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    await input.setValue('20261020')
    const updates = wrapper.emitted('update:modelValue') ?? []
    expect(updates[updates.length - 1]).toEqual(['2026-10-20'])
  })

  it('달력과 선택일까지 남은 주 단위를 표시한다', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 7, 12))
    const wrapper = mount(GoalDatePicker, { props: { modelValue: '2026-09-21' } })

    await wrapper.get('button[aria-label="달력 열기"]').trigger('click')

    expect(wrapper.text()).toContain('2026년 9월')
    expect(wrapper.text()).toContain('선택한 날짜까지 약 2주 남았어요.')
    expect(wrapper.get('button[aria-label="9월 7일"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[aria-label="9월 7일"]').attributes('aria-current')).toBe('date')
    expect(wrapper.get('button[aria-label="9월 7일"]').classes()).toContain('border-brand')
    expect(wrapper.get('button[aria-label="9월 8일"]').attributes('disabled')).toBeUndefined()
  })
})
