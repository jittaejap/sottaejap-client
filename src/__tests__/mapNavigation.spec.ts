import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { routes } from '@/router'
import HomeView from '@/views/HomeView.vue'
import MapView from '@/views/MapView.vue'
import { ApiError } from '@/api/apiError'
import type { BehaviorDetail, SatisfactionMap, SatisfactionMapPoint } from '@/api/types'
import {
  getBehavior,
  getGoals,
  getMonthlyReport,
  getNotifications,
  getSatisfactionMap,
  getSuggestions,
} from '@/api/service'

vi.mock('@/api/service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/service')>()),
  getSatisfactionMap: vi.fn(),
  getBehavior: vi.fn(),
  getGoals: vi.fn(),
  getMonthlyReport: vi.fn(),
  getSuggestions: vi.fn(),
  getNotifications: vi.fn(),
}))

function mapPoint(overrides: Partial<SatisfactionMapPoint> = {}): SatisfactionMapPoint {
  return {
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
    ...overrides,
  }
}

function satisfactionMap(points: SatisfactionMapPoint[]): SatisfactionMap {
  return {
    analysisYearMonth: '2026-09',
    axisX: {
      label: '실제 지출 부담',
      formula: 'MONTHLY_TOTAL_OVER_BUDGET',
      monthlyBudget: 1_000_000,
    },
    axisY: { label: '실제 만족도', range: [-1, 1] },
    boundaries: { x: 0.1, y: 0 },
    points,
  }
}

function behaviorDetail(overrides: Partial<BehaviorDetail> = {}): BehaviorDetail {
  return {
    behavior: {
      behaviorId: 42,
      name: '실제 배달',
      clusterKey: '배달|NIGHT|충동|혼자',
      parentId: null,
      monthlyTotalAmount: 100_000,
      avgAmount: 20_000,
      txCount: 5,
      retrospectCount: 3,
      burdenRatio: 0.1,
      adjustedSatisfaction: -0.5,
      evaluationStatus: 'RESOLVED',
      quadrant: 'PRIORITY',
      verdict: 'ADJUST',
    },
    transactions: [],
    ...overrides,
  }
}

function mountMap(router: ReturnType<typeof createRouter>) {
  return mount(MapView, {
    global: { plugins: [createPinia(), router], stubs: { SatisfactionScatter: true } },
  })
}

async function mapRouter(path = '/map') {
  const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
  await router.push(path)
  await router.isReady()
  return router
}

beforeEach(() => {
  vi.mocked(getSatisfactionMap).mockRejectedValue(new Error('offline'))
  vi.mocked(getBehavior).mockResolvedValue(behaviorDetail())
  vi.mocked(getGoals).mockResolvedValue([])
  vi.mocked(getMonthlyReport).mockRejectedValue(new Error('offline'))
  vi.mocked(getSuggestions).mockResolvedValue([])
  vi.mocked(getNotifications).mockResolvedValue({ unreadCount: 0, notifications: [] })
})

describe('만족도 지도 이동', () => {
  it('API 성공 시 정렬된 첫 행동을 선택하고 실제 축과 상세를 표시한다', async () => {
    vi.mocked(getSatisfactionMap).mockResolvedValueOnce(satisfactionMap([mapPoint()]))
    const wrapper = mountMap(await mapRouter())
    await flushPromises()

    expect(wrapper.text()).toContain('실제 지출 부담')
    expect(wrapper.text()).toContain('실제 배달(3)')
    expect(wrapper.text()).toContain('실제 처방')
    expect(wrapper.text()).not.toContain('예시 데이터를')
  })

  it('카테고리 카드의 더 보기에서 선택한 카테고리 회고 내역으로 바로 이동한다', async () => {
    vi.mocked(getSatisfactionMap).mockResolvedValueOnce(
      satisfactionMap([mapPoint({ behaviorId: 7, name: '택시' })]),
    )
    const wrapper = mountMap(await mapRouter())
    await flushPromises()

    const reviewLink = wrapper.findAll('a').find((link) => link.text().includes('더 보기'))
    if (!reviewLink) throw new Error('더 보기 링크를 찾지 못했습니다.')
    expect(reviewLink.attributes('href')).toBe('/map/behaviors/7/reviews')
  })

  it('조회에 실패하면 목업 대신 오류 안내와 재시도 버튼만 보여 준다', async () => {
    vi.mocked(getSatisfactionMap).mockRejectedValue(
      new ApiError('INTERNAL_ERROR', 500, '서버 문구'),
    )
    const wrapper = mountMap(await mapRouter())
    await flushPromises()

    expect(wrapper.text()).toContain('만족도 지도를 불러오지 못했어요. 다시 시도해주세요.')
    expect(wrapper.html()).not.toContain('satisfaction-scatter')
    expect(wrapper.text()).not.toContain('실제 지출 부담')
    expect(wrapper.text()).not.toContain('여행')
    expect(wrapper.text()).not.toContain('심야 배달')

    const callsBeforeRetry = vi.mocked(getSatisfactionMap).mock.calls.length
    vi.mocked(getSatisfactionMap).mockResolvedValueOnce(satisfactionMap([mapPoint()]))
    const retry = wrapper.findAll('button').find((button) => button.text() === '다시 시도')
    if (!retry) throw new Error('다시 시도 버튼을 찾지 못했습니다.')
    await retry.trigger('click')
    await flushPromises()

    expect(getSatisfactionMap).toHaveBeenCalledTimes(callsBeforeRetry + 1)
    expect(wrapper.text()).toContain('실제 배달(3)')
    expect(wrapper.text()).not.toContain('만족도 지도를 불러오지 못했어요')
  })

  it('점이 0개면 실패가 아니라 빈 상태 안내를 보여 준다', async () => {
    vi.mocked(getSatisfactionMap).mockResolvedValueOnce(satisfactionMap([]))
    const wrapper = mountMap(await mapRouter())
    await flushPromises()

    expect(wrapper.text()).toContain('아직 지도에 그릴 회고가 없어요.')
    expect(wrapper.text()).not.toContain('만족도 지도를 불러오지 못했어요')
    expect(wrapper.text()).not.toContain('다시 시도')
    expect(wrapper.html()).not.toContain('satisfaction-scatter')
  })

  it('거래 하위 화면은 GET /behaviors/{id} 응답의 거래를 그린다', async () => {
    vi.mocked(getSatisfactionMap).mockResolvedValueOnce(satisfactionMap([mapPoint()]))
    vi.mocked(getBehavior).mockResolvedValue(
      behaviorDetail({
        transactions: [
          {
            id: 1043,
            occurredAt: '2026-08-24T23:30:00+09:00',
            merchant: '배달의민족',
            amount: 12_000,
            category: '배달',
            timeSlot: 'NIGHT',
            behaviorId: 42,
          },
          {
            id: 1044,
            occurredAt: '2026-08-21T22:10:00+09:00',
            merchant: '쿠팡이츠',
            amount: 18_000,
            category: '배달',
            timeSlot: 'NIGHT',
            behaviorId: 42,
          },
        ],
      }),
    )
    const wrapper = mountMap(await mapRouter('/map/behaviors/42'))
    await flushPromises()

    const openTransactions = wrapper
      .findAll('button')
      .find((button) => button.text() === '거래 내역 보기')
    if (!openTransactions) throw new Error('거래 내역 보기 버튼을 찾지 못했습니다.')
    await openTransactions.trigger('click')
    await flushPromises()

    expect(getBehavior).toHaveBeenCalledWith(42)
    expect(wrapper.text()).toContain('배달의민족')
    expect(wrapper.text()).toContain('쿠팡이츠')
    expect(wrapper.text()).toContain('(총 2건)')
    expect(wrapper.text()).toContain('총 30,000원')
    // 응답에 없는 값은 만들지 않는다 — 5점 척도 배지도 목업 가맹점도 없다.
    expect(wrapper.text()).not.toContain('/5')
    expect(wrapper.text()).not.toContain('요기요')
    expect(wrapper.text()).not.toContain('교촌치킨')
  })

  it('홈 행동 변화 카드는 behaviorId path param으로 상세 화면을 연다', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/')
    await router.isReady()
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(HomeView, {
      global: { plugins: [createPinia(), router], stubs: { WeeklyTrendChart: true } },
    })

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
    const wrapper = mount(HomeView, {
      global: { plugins: [createPinia(), router], stubs: { WeeklyTrendChart: true } },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('2%')
    expect(wrapper.text()).toContain('데이터 없음')
    expect(wrapper.text()).not.toContain('전월 대비')

    const savingsButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('이번 달 절감액'))
    if (!savingsButton) throw new Error('절감액 카드를 찾지 못했습니다.')
    await savingsButton.trigger('click')

    expect(wrapper.text()).toContain('이번 달 총 절감액')
    expect(wrapper.text()).toContain('데이터 없음')
    expect(wrapper.text()).not.toContain('전월 대비')
  })

  it('홈과 절감액 상세가 같은 실데이터와 증감률을 표시한다', async () => {
    vi.mocked(getMonthlyReport).mockResolvedValueOnce({
      yearMonth: '2026-09',
      finalized: true,
      totalSpending: 1_200_000,
      previousTotalSpending: 1_000_000,
      savedAmount: 42_000,
      unsatisfiedCount: 0,
      repeatCount: 0,
      previousRepeatCount: 0,
      goalAllocations: [],
    })
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/')
    await router.isReady()
    const wrapper = mount(HomeView, {
      global: { plugins: [createPinia(), router], stubs: { WeeklyTrendChart: true } },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('42,000원')
    expect(wrapper.text()).toContain('전월 대비 +20%')

    const savingsButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('이번 달 절감액'))
    if (!savingsButton) throw new Error('절감액 카드를 찾지 못했습니다.')
    await savingsButton.trigger('click')

    expect(wrapper.text()).toContain('이번 달 총 절감액')
    expect(wrapper.text()).toContain('42,000원')
    expect(wrapper.text()).toContain('전월 대비 +20%')
    expect(wrapper.text()).not.toContain('전월 대비 +12%')
  })

  it('음수 savedAmount는 절감액이 아닌 추가 지출로 표시한다', async () => {
    vi.mocked(getMonthlyReport).mockResolvedValueOnce({
      yearMonth: '2026-09',
      finalized: true,
      totalSpending: 1_036_000,
      previousTotalSpending: 1_000_000,
      savedAmount: -36_000,
      unsatisfiedCount: 0,
      repeatCount: 0,
      previousRepeatCount: 0,
      goalAllocations: [],
    })
    const router = createRouter({ history: createMemoryHistory(), routes: [...routes] })
    await router.push('/')
    await router.isReady()
    const wrapper = mount(HomeView, {
      global: { plugins: [createPinia(), router], stubs: { WeeklyTrendChart: true } },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('이번 달 추가 지출')
    expect(wrapper.text()).toContain('36,000원')
    expect(wrapper.text()).not.toContain('-36,000원')

    const savingsButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('이번 달 추가 지출'))
    if (!savingsButton) throw new Error('추가 지출 카드를 찾지 못했습니다.')
    await savingsButton.trigger('click')

    expect(wrapper.text()).toContain('이번 달 총 추가 지출')
    expect(wrapper.text()).toContain('36,000원')
    expect(wrapper.text()).not.toContain('이번 달 총 절감액')
  })
})
