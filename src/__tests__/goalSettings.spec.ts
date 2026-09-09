import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import { routes } from '@/router'
import MoneyInput from '@/components/common/MoneyInput.vue'
import { createGoal, deleteGoal, getGoals, updateGoal } from '@/api/service'
import type { Goal } from '@/api/types'
import GoalSettingsView from '@/views/GoalSettingsView.vue'

vi.mock('@/api/service', () => ({
  getGoals: vi.fn(),
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
}))

const savedGoal: Goal = {
  id: 7,
  name: '여행 자금',
  targetAmount: 1_000_000,
  targetDate: '2026-12-25',
  currentAmount: 0,
  adoptedSaving: 24_000,
  achievementRate: 0,
  projectedRate: 0.024,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getGoals).mockResolvedValue([savedGoal])
  vi.mocked(createGoal).mockResolvedValue({ ...savedGoal, id: 9 })
  vi.mocked(updateGoal).mockResolvedValue(savedGoal)
  vi.mocked(deleteGoal).mockResolvedValue(undefined)
})

async function click(wrapper: VueWrapper, label: string) {
  const button = wrapper.findAll('button').find((item) => item.text().includes(label))
  if (!button) throw new Error('버튼을 찾지 못했습니다: ' + label)
  await button.trigger('click')
  await flushPromises()
}

async function mountView() {
  const pinia = createPinia()
  const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
  await router.push('/me/goals')
  await router.isReady()
  const wrapper = mount(GoalSettingsView, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { wrapper, router }
}

describe('목표 자금 관리 — 예정일과 삭제 (#49)', () => {
  it('저장된 예정일을 달력 입력에 채우고, 손대지 않으면 PUT에서 생략한다', async () => {
    const { wrapper } = await mountView()

    const dateInput = wrapper.get('input[aria-label="목표 달성 예정일"]')
    expect((dateInput.element as HTMLInputElement).value).toBe('2026.12.25')

    await click(wrapper, '저장하기')

    expect(updateGoal).toHaveBeenCalledWith(7, { name: '여행 자금', targetAmount: 1_000_000 })
  })

  it('사용자가 고른 예정일만 PUT에 YYYY-MM-DD로 싣는다', async () => {
    const { wrapper } = await mountView()

    const dateInput = wrapper.get('input[aria-label="목표 달성 예정일"]')
    await dateInput.setValue('20270301')
    await click(wrapper, '저장하기')

    expect(updateGoal).toHaveBeenCalledWith(7, {
      name: '여행 자금',
      targetAmount: 1_000_000,
      targetDate: '2027-03-01',
    })
  })

  it('목표가 없으면 POST에 targetDate를 싣고, 고르지 않았으면 생략한다', async () => {
    vi.mocked(getGoals).mockResolvedValue([])
    const { wrapper } = await mountView()

    await click(wrapper, '저장하기')
    expect(createGoal).toHaveBeenCalledWith({
      name: '여행 자금',
      targetAmount: 1_000_000,
      currentAmount: 0,
    })
  })

  it('삭제는 확인을 거쳐 DELETE를 부르고 빈 상태를 보여준다', async () => {
    const { wrapper } = await mountView()

    await click(wrapper, '목표 삭제')
    expect(wrapper.text()).toContain('정말 삭제할까요?')
    expect(deleteGoal).not.toHaveBeenCalled()

    vi.mocked(getGoals).mockResolvedValue([])
    await click(wrapper, '삭제하기')

    expect(deleteGoal).toHaveBeenCalledWith(7)
    expect(getGoals).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('등록된 목표가 없어요')

    await click(wrapper, '새로 만들기')
    expect(wrapper.text()).toContain('저축 목표를 설정해 주세요')
  })

  it('목표가 없으면 삭제 버튼을 그리지 않는다', async () => {
    vi.mocked(getGoals).mockResolvedValue([])
    const { wrapper } = await mountView()

    expect(wrapper.findAll('button').some((item) => item.text().includes('목표 삭제'))).toBe(false)
  })
})

describe('목표 자금 관리 — 모은 금액과 달성률 (#32)', () => {
  it('두 비율을 지금 · 채택대로 가면 순서로 반올림해 보여준다', async () => {
    vi.mocked(getGoals).mockResolvedValue([
      { ...savedGoal, currentAmount: 400_000, achievementRate: 0.4, projectedRate: 0.5551 },
    ])
    const { wrapper } = await mountView()

    const rates = wrapper.get('[data-testid="goal-rates"]').text()
    expect(rates).toContain('지금')
    expect(rates).toContain('40%')
    expect(rates).toContain('채택대로 가면')
    expect(rates).toContain('56%')
  })

  it('비율이 null이면 대체 문구를 보여준다', async () => {
    vi.mocked(getGoals).mockResolvedValue([
      { ...savedGoal, targetAmount: 0, achievementRate: null, projectedRate: null },
    ])
    const { wrapper } = await mountView()

    expect(wrapper.get('[data-testid="goal-rates"]').text()).toBe(
      '목표 금액을 정하면 달성률을 보여드려요.',
    )
  })

  it('모은 금액을 고쳤을 때만 PUT에 currentAmount를 싣는다', async () => {
    const { wrapper } = await mountView()

    await click(wrapper, '저장하기')
    expect(updateGoal).toHaveBeenLastCalledWith(7, { name: '여행 자금', targetAmount: 1_000_000 })

    const currentAmountInput = wrapper.findAllComponents(MoneyInput)[1]!
    await currentAmountInput.get('input').setValue('250000')
    await click(wrapper, '저장하기')

    expect(updateGoal).toHaveBeenLastCalledWith(7, {
      name: '여행 자금',
      targetAmount: 1_000_000,
      currentAmount: 250_000,
    })
  })

  it('목표가 없으면 입력한 모은 금액을 POST에 싣는다', async () => {
    vi.mocked(getGoals).mockResolvedValue([])
    const { wrapper } = await mountView()

    const currentAmountInput = wrapper.findAllComponents(MoneyInput)[1]!
    await currentAmountInput.get('input').setValue('80000')
    await click(wrapper, '저장하기')

    expect(createGoal).toHaveBeenCalledWith({
      name: '여행 자금',
      targetAmount: 1_000_000,
      currentAmount: 80_000,
    })
  })
})
