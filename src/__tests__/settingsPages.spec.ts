import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import { updateSettings } from '@/api/service'
import type { UserMe } from '@/api/types'
import { routes } from '@/router'
import { useSettingsStore } from '@/stores/settings'
import { useUserStore } from '@/stores/user'
import AnalysisSettingsView from '@/views/AnalysisSettingsView.vue'
import BudgetSettingsView from '@/views/BudgetSettingsView.vue'
import GoalSettingsView from '@/views/GoalSettingsView.vue'
import MyPageView from '@/views/MyPageView.vue'

vi.mock('@/api/service', () => ({
  updateSettings: vi.fn().mockResolvedValue({}),
  getGoals: vi.fn().mockResolvedValue([]),
  createGoal: vi.fn().mockResolvedValue({ id: 1 }),
  updateGoal: vi.fn().mockResolvedValue({ id: 1 }),
  deleteGoal: vi.fn().mockResolvedValue(undefined),
}))

async function click(wrapper: VueWrapper, label: string) {
  const button = wrapper.findAll('button').find((item) => item.text().includes(label))
  if (!button) throw new Error('버튼을 찾지 못했습니다: ' + label)
  await button.trigger('click')
  await flushPromises()
}

async function setup(path: string) {
  const pinia = createPinia()
  const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
  await router.push(path)
  await router.isReady()
  return { pinia, router }
}

/** 소비 분석 설정 화면은 서버가 준 `me`를 정본으로 읽는다. */
function signedInAs(pinia: ReturnType<typeof createPinia>, settings: Partial<UserMe>) {
  useUserStore(pinia).replaceMe({
    id: 1,
    email: 'demo@sottaejap.kr',
    nickname: '데모 사용자',
    authProvider: 'LOCAL',
    monthlyBudget: 2_500_000,
    outlierThreshold: 2,
    outlierBaseAmount: 100_000,
    retrospectDelayDays: 1,
    onboardingCompleted: true,
    analysisYearMonth: null,
    ...settings,
  })
}

describe('마이페이지 설정 화면', () => {
  // "부르지 않는다"를 보는 검사가 앞 검사의 호출을 물려받지 않게 한다.
  beforeEach(() => {
    vi.mocked(updateSettings).mockClear()
  })

  it('세 메뉴가 각각 설정 페이지로 이동한다', async () => {
    for (const [label, path] of [
      ['월 예산 설정', '/me/budget'],
      ['목표 자금 관리', '/me/goals'],
      ['소비 분석 민감도', '/me/analysis-settings'],
    ] as const) {
      const { pinia, router } = await setup('/me')
      const wrapper = mount(MyPageView, { global: { plugins: [pinia, router] } })
      await click(wrapper, label)
      expect(router.currentRoute.value.path).toBe(path)
    }
  })

  it('월 예산 설정값을 화면 상태에 저장한다', async () => {
    const { pinia, router } = await setup('/me/budget')
    const wrapper = mount(BudgetSettingsView, { global: { plugins: [pinia, router] } })
    const input = wrapper.get('input[inputmode="numeric"]')
    expect(wrapper.get('[data-testid="current-budget"]').text()).toBe('2,500,000원')

    await input.setValue('3200000')
    expect(wrapper.get('[data-testid="current-budget"]').text()).toBe('2,500,000원')

    await click(wrapper, '저장하기')

    expect(useSettingsStore(pinia).monthlyBudget).toBe(3_200_000)
    expect(router.currentRoute.value.path).toBe('/me')
  })

  it('목표 설정값을 화면 상태에 저장한다', async () => {
    const goalSetup = await setup('/me/goals')
    const goalWrapper = mount(GoalSettingsView, {
      global: { plugins: [goalSetup.pinia, goalSetup.router] },
    })
    await click(goalWrapper, '비상금')
    await click(goalWrapper, '저장하기')

    const goalStore = useSettingsStore(goalSetup.pinia)
    expect(goalStore.goalType).toBe('EMERGENCY')
    expect(goalStore.goalName).toBe('비상금 자금')
  })

  it('저장한 배수로 프리셋을, 저장한 기준 금액으로 입력란을 그린다', async () => {
    const { pinia, router } = await setup('/me/analysis-settings')
    signedInAs(pinia, { outlierThreshold: 1.5, outlierBaseAmount: 70_000 })
    const wrapper = mount(AnalysisSettingsView, { global: { plugins: [pinia, router] } })

    const detailed = wrapper.findAll('button').find((item) => item.text().includes('꼼꼼하게'))
    expect(detailed?.classes()).toContain('border-brand')
    expect((wrapper.get('input[inputmode="numeric"]').element as HTMLInputElement).value).toBe(
      '70,000',
    )
  })

  it('기준 금액이 null이면 직접 설정 안 함으로 그리고 0을 보내지 않는다', async () => {
    const { pinia, router } = await setup('/me/analysis-settings')
    signedInAs(pinia, { outlierBaseAmount: null })
    const wrapper = mount(AnalysisSettingsView, { global: { plugins: [pinia, router] } })

    expect((wrapper.get('input[inputmode="numeric"]').element as HTMLInputElement).value).toBe('')
    expect(wrapper.text()).toContain('직접 설정 안 함')

    const saveButton = wrapper.findAll('button').find((item) => item.text().includes('저장하기'))
    expect(saveButton?.attributes('disabled')).toBeDefined()

    await click(wrapper, '저장하기')
    expect(updateSettings).not.toHaveBeenCalled()
  })

  it('프리셋만 바꾸면 배수와 그 프리셋의 기준 금액을 함께 보낸다', async () => {
    const { pinia, router } = await setup('/me/analysis-settings')
    signedInAs(pinia, { outlierThreshold: 2, outlierBaseAmount: 100_000 })
    const wrapper = mount(AnalysisSettingsView, { global: { plugins: [pinia, router] } })

    await click(wrapper, '꼼꼼하게')
    await click(wrapper, '저장하기')

    expect(updateSettings).toHaveBeenLastCalledWith({
      outlierThreshold: 1.5,
      outlierBaseAmount: 50_000,
    })
    expect(router.currentRoute.value.path).toBe('/me')
  })

  it('금액만 바꾸면 기준 금액만 보낸다', async () => {
    const { pinia, router } = await setup('/me/analysis-settings')
    signedInAs(pinia, { outlierThreshold: 2, outlierBaseAmount: 100_000 })
    const wrapper = mount(AnalysisSettingsView, { global: { plugins: [pinia, router] } })

    await wrapper.get('input[inputmode="numeric"]').setValue('1500000')
    await click(wrapper, '저장하기')

    expect(updateSettings).toHaveBeenLastCalledWith({ outlierBaseAmount: 1_500_000 })
  })

  it('아무것도 바꾸지 않으면 설정 API를 부르지 않는다', async () => {
    const { pinia, router } = await setup('/me/analysis-settings')
    signedInAs(pinia, { outlierThreshold: 2, outlierBaseAmount: 100_000 })
    const wrapper = mount(AnalysisSettingsView, { global: { plugins: [pinia, router] } })

    const saveButton = wrapper.findAll('button').find((item) => item.text().includes('저장하기'))
    expect(saveButton?.attributes('disabled')).toBeDefined()

    await click(wrapper, '저장하기')
    expect(updateSettings).not.toHaveBeenCalled()
  })
})
