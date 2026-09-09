import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { routes } from '@/router'
import HomeView from '@/views/HomeView.vue'
import MapView from '@/views/MapView.vue'
import {
  getGoals,
  getMonthlyReport,
  getNotifications,
  getSatisfactionMap,
  getSuggestions,
} from '@/api/service'

vi.mock('@/api/service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/service')>()),
  getSatisfactionMap: vi.fn(),
  getGoals: vi.fn(),
  getMonthlyReport: vi.fn(),
  getSuggestions: vi.fn(),
  getNotifications: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(getSatisfactionMap).mockRejectedValue(new Error('offline'))
  vi.mocked(getGoals).mockResolvedValue([])
  vi.mocked(getMonthlyReport).mockRejectedValue(new Error('offline'))
  vi.mocked(getSuggestions).mockResolvedValue([])
  vi.mocked(getNotifications).mockResolvedValue({ unreadCount: 0, notifications: [] })
})

describe('만족도 지도 이동', () => {
  it('API 성공 시 정렬된 첫 행동을 선택하고 실제 축과 상세를 표시한다', async () => {
    vi.mocked(getSatisfactionMap).mockResolvedValueOnce({
      analysisYearMonth: '2026-09',
      axisX: {
        label: '실제 지출 부담',
        formula: 'MONTHLY_TOTAL_OVER_BUDGET',
        monthlyBudget: 1_000_000,
      },
      axisY: { label: '실제 만족도', range: [-1, 1] },
      boundaries: { x: 0.1, y: 0 },
      points: [
        {
          behaviorId: 42,
          name: '실제 배달',
          monthlyTotalAmount: 100_000,
          avgAmount: 20_000,
          txCount: 5,
          burdenRatio: 0.1,
          adjustedSatisfaction: -0.5,
          retrospectCount: 3,
          evaluationStatus: 'RESOLVED',
          quadrant: 'PRIORITY',
          verdict: 'ADJUST',
          prescription: '실제 처방',
          cta: null,
        },
      ],
    })
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/map')
    await router.isReady()
    const wrapper = mount(MapView, {
      global: { plugins: [createPinia(), router], stubs: { SatisfactionScatter: true } },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('실제 지출 부담')
    expect(wrapper.text()).toContain('실제 배달(3)')
    expect(wrapper.text()).not.toContain('예시 데이터를')
  })

  it('카테고리 카드의 더 보기에서 선택한 카테고리 회고 내역으로 바로 이동한다', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/map')
    await router.isReady()

    const wrapper = mount(MapView, {
      global: {
        plugins: [createPinia(), router],
        stubs: { SatisfactionScatter: true },
      },
    })
    await flushPromises()

    const reviewLink = wrapper.findAll('a').find((link) => link.text().includes('더 보기'))
    if (!reviewLink) throw new Error('더 보기 링크를 찾지 못했습니다.')
    expect(reviewLink.attributes('href')).toBe('/map/behaviors/7/reviews')
  })

  it('홈 행동 변화 카드는 behaviorId path param으로 상세 화면을 연다', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/')
    await router.isReady()
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(HomeView, { global: { plugins: [createPinia(), router] } })

    const behaviorButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('행동 변화'))
    if (!behaviorButton) throw new Error('행동 변화 카드를 찾지 못했습니다.')
    await behaviorButton.trigger('click')

    expect(pushSpy).toHaveBeenCalledWith({
      name: 'behavior-detail',
      params: { behaviorId: 6 },
    })
  })

  it('홈은 raw 목표 비율과 nullable 월간 리포트를 구분해 표시한다', async () => {
    vi.mocked(getGoals).mockResolvedValueOnce([
      {
        id: 3,
        name: '여행 자금',
        targetAmount: 1_000_000,
        currentAmount: 0,
        adoptedSaving: 24_000,
        achievementRate: 0,
        projectedRate: 0.024,
      },
    ])
    vi.mocked(getMonthlyReport).mockResolvedValueOnce({
      yearMonth: '2026-09',
      finalized: false,
      totalSpending: 0,
      previousTotalSpending: null,
      savedAmount: null,
      unsatisfiedCount: 0,
      repeatCount: 0,
      previousRepeatCount: null,
      goalAllocations: [],
    })
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/')
    await router.isReady()
    const wrapper = mount(HomeView, { global: { plugins: [createPinia(), router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('2%')
    expect(wrapper.text()).toContain('데이터 없음')
    expect(wrapper.text()).not.toContain('전월 대비')
  })
})
