import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import { routes } from '@/router'
import MoneyInput from '@/components/common/MoneyInput.vue'
import { createGoal } from '@/api/service'
import OnboardingView from '@/views/OnboardingView.vue'

vi.mock('@/api/service', () => ({
  createGoal: vi.fn().mockResolvedValue({ id: 1 }),
  uploadTransactions: vi.fn(),
  startOnboarding: vi.fn(),
  updateSettings: vi.fn(),
  saveRetrospect: vi.fn(),
  completeOnboarding: vi.fn(),
}))

describe('온보딩 1단계 목표 등록 (#49)', () => {
  it('달력에서 고른 예정일을 POST /goals에 targetDate로 싣는다', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/onboarding')
    await router.isReady()
    const wrapper = mount(OnboardingView, { global: { plugins: [createPinia(), router] } })

    const dateInput = wrapper.get('input[aria-label="목표 달성 예정일"]')
    await dateInput.setValue('20271115')

    const nextButton = wrapper
      .findAll('button')
      .find((item) => item.text().trim() === '다음 단계로')!
    await nextButton.trigger('click')
    await flushPromises()

    expect(createGoal).toHaveBeenCalledWith({
      name: '여행 자금',
      targetAmount: 3_000_000,
      targetDate: '2027-11-15',
      currentAmount: 0,
    })
  })

  it('입력한 모은 금액을 currentAmount로 싣는다 (#32)', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/onboarding')
    await router.isReady()
    const wrapper = mount(OnboardingView, { global: { plugins: [createPinia(), router] } })

    await wrapper.findAllComponents(MoneyInput)[1]!.get('input').setValue('450000')

    const nextButton = wrapper
      .findAll('button')
      .find((item) => item.text().trim() === '다음 단계로')!
    await nextButton.trigger('click')
    await flushPromises()

    expect(createGoal).toHaveBeenCalledWith(
      expect.objectContaining({ currentAmount: 450_000, targetAmount: 3_000_000 }),
    )
  })
})
