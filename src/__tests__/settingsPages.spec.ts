import { describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import { routes } from '@/router'
import { useSettingsStore } from '@/stores/settings'
import AnalysisSettingsView from '@/views/AnalysisSettingsView.vue'
import BudgetSettingsView from '@/views/BudgetSettingsView.vue'
import GoalSettingsView from '@/views/GoalSettingsView.vue'
import MyPageView from '@/views/MyPageView.vue'

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

describe('마이페이지 설정 화면', () => {
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

  it('목표와 소비 분석 기준 설정값을 화면 상태에 저장한다', async () => {
    const goalSetup = await setup('/me/goals')
    const goalWrapper = mount(GoalSettingsView, {
      global: { plugins: [goalSetup.pinia, goalSetup.router] },
    })
    await click(goalWrapper, '비상금')
    await click(goalWrapper, '저장하기')

    const goalStore = useSettingsStore(goalSetup.pinia)
    expect(goalStore.goalType).toBe('EMERGENCY')
    expect(goalStore.goalName).toBe('비상금 자금')

    const analysisSetup = await setup('/me/analysis-settings')
    const analysisWrapper = mount(AnalysisSettingsView, {
      global: { plugins: [analysisSetup.pinia, analysisSetup.router] },
    })
    await click(analysisWrapper, '꼼꼼하게')
    await click(analysisWrapper, '저장하기')

    const analysisStore = useSettingsStore(analysisSetup.pinia)
    expect(analysisStore.sensitivity).toBe('DETAILED')
    expect(analysisStore.outlierBaseAmount).toBe(50_000)
  })

  it('직접 입력 금액이 있으면 카드 대신 해당 금액을 분석 기준으로 저장한다', async () => {
    const { pinia, router } = await setup('/me/analysis-settings')
    const wrapper = mount(AnalysisSettingsView, { global: { plugins: [pinia, router] } })
    const input = wrapper.get('input[inputmode="numeric"]')

    expect((input.element as HTMLInputElement).value).toBe('')
    const saveButton = wrapper.findAll('button').find((item) => item.text().includes('저장하기'))
    expect(saveButton?.attributes('disabled')).toBeUndefined()

    await input.setValue('1500000')
    await click(wrapper, '저장하기')

    const store = useSettingsStore(pinia)
    expect(store.sensitivity).toBeNull()
    expect(store.outlierBaseAmount).toBe(1_500_000)
  })
})
