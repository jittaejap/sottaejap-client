import { describe, expect, it } from 'vitest'

import type { SatisfactionMapPoint } from '@/api/types'
import {
  VERDICT_COLOR_VAR,
  VERDICT_DOT_CLASS,
  VERDICT_OPACITY,
  verdictTone,
} from '@/components/map/verdictStyle'

function point(overrides: Partial<SatisfactionMapPoint>): SatisfactionMapPoint {
  return {
    behaviorId: 1,
    name: '심야 배달',
    monthlyTotalAmount: 108_500,
    avgAmount: 21_700,
    txCount: 5,
    burdenRatio: 0.043,
    adjustedSatisfaction: -0.72,
    retrospectCount: 5,
    evaluationStatus: 'RESOLVED',
    quadrant: 'PRIORITY',
    verdict: 'ADJUST',
    prescription: '',
    cta: null,
    ...overrides,
  }
}

describe('07 §8 · E-11 만족도 지도 색 규칙', () => {
  it('판정이 끝난 점은 verdict 2색만 쓴다', () => {
    expect(verdictTone(point({ verdict: 'SUSTAIN', quadrant: 'PROTECT' }))).toBe('sustain')
    expect(verdictTone(point({ verdict: 'ADJUST' }))).toBe('adjust')
  })

  it('보류(PENDING)는 verdict 색이 아니라 회색 반투명으로 구분한다', () => {
    const pending = point({ evaluationStatus: 'PENDING', quadrant: null, verdict: null })

    expect(verdictTone(pending)).toBe('pending')
    expect(VERDICT_COLOR_VAR[verdictTone(pending)]).toBe('--color-verdict-pending')
    expect(VERDICT_OPACITY[verdictTone(pending)]).toBeLessThan(1)
    expect(VERDICT_DOT_CLASS[verdictTone(pending)]).not.toContain('sustain')
    expect(VERDICT_DOT_CLASS[verdictTone(pending)]).not.toContain('adjust')
  })

  it('보류 판정이 verdict보다 우선한다 — 서버가 값을 함께 보내도 회색이다', () => {
    const inconsistent = point({ evaluationStatus: 'PENDING', verdict: 'ADJUST' })

    expect(verdictTone(inconsistent)).toBe('pending')
  })

  it('색 종류는 판정 2색과 보류 1색뿐이다', () => {
    expect(Object.keys(VERDICT_COLOR_VAR).sort()).toEqual(['adjust', 'pending', 'sustain'])
  })
})
