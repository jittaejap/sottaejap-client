import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import type { SatisfactionMap, SatisfactionMapPoint } from '@/api/types'
import { useMapStore } from '@/stores/map'

function point(overrides: Partial<SatisfactionMapPoint>): SatisfactionMapPoint {
  return {
    behaviorId: 1,
    name: '행동',
    monthlyTotalAmount: 100_000,
    avgAmount: 20_000,
    txCount: 5,
    burdenRatio: 0.04,
    adjustedSatisfaction: 0,
    retrospectCount: 3,
    evaluationStatus: 'RESOLVED',
    quadrant: 'PRIORITY',
    verdict: 'ADJUST',
    prescription: '',
    cta: null,
    ...overrides,
  }
}

function map(points: SatisfactionMapPoint[]): SatisfactionMap {
  return {
    analysisYearMonth: '2025-05',
    axisX: { label: '지출 부담', formula: 'MONTHLY_TOTAL_OVER_BUDGET', monthlyBudget: 2_500_000 },
    axisY: { label: '만족도', range: [-1, 1] },
    boundaries: { x: 0.04, y: 0 },
    points,
  }
}

describe('map store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('07 §8 정렬 — ADJUST 먼저, 그 안에서 burdenRatio 내림차순', () => {
    const store = useMapStore()
    store.data = map([
      point({ behaviorId: 1, name: '여행', verdict: 'SUSTAIN', burdenRatio: 0.03 }),
      point({ behaviorId: 2, name: '택시', verdict: 'ADJUST', burdenRatio: 0.056 }),
      point({ behaviorId: 3, name: '친구와 외식', verdict: 'SUSTAIN', burdenRatio: 0.076 }),
      point({ behaviorId: 4, name: '심야 배달', verdict: 'ADJUST', burdenRatio: 0.0434 }),
    ])

    expect(store.sortedPoints.map((p) => p.name)).toEqual([
      '택시',
      '심야 배달',
      '친구와 외식',
      '여행',
    ])
  })

  it('데이터가 없으면 빈 배열이다', () => {
    const store = useMapStore()

    expect(store.sortedPoints).toEqual([])
  })
})
