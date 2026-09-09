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

  it('중간 날짜를 수정해도 입력 커서를 수정 위치에 유지한다', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 7, 12))
    const wrapper = mount(GoalDatePicker, { props: { modelValue: '2026-10-20' } })
    const input = wrapper.get('input[aria-label="목표 달성 예정일"]')
    const element = input.element as HTMLInputElement

    element.value = '2026.110.20'
    element.setSelectionRange(6, 6)
    await input.trigger('input')

    expect(element.value).toBe('2026.11.02')
    expect(element.selectionStart).toBe(6)
  })

  it('달력을 표시하고 선택일까지 남은 기간 문구는 표시하지 않는다', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 7, 12))
    const wrapper = mount(GoalDatePicker, { props: { modelValue: '2026-09-21' } })

    await wrapper.get('button[aria-label="달력 열기"]').trigger('click')

    expect(wrapper.text()).toContain('2026년 9월')
    expect(wrapper.text()).not.toContain('남았어요')
    expect(wrapper.get('button[aria-label="9월 7일"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[aria-label="9월 7일"]').attributes('aria-current')).toBe('date')
    expect(wrapper.get('button[aria-label="9월 7일"]').classes()).toContain('bg-brand-soft')
    expect(wrapper.get('button[aria-label="9월 7일"]').classes()).not.toContain('border-brand')
    expect(wrapper.get('button[aria-label="9월 8일"]').attributes('disabled')).toBeUndefined()
  })
})
