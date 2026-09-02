import type { AuthProvider, EvaluationStatus, Quadrant, Verdict } from '@/api/enums'

/** `GET /users/me` (05 §1 #2) */
export interface UserMe {
  id: number
  email: string
  authProvider: AuthProvider
  monthlyBudget: number
  outlierThreshold: number
  retrospectDelayDays: number
  onboardingCompleted: boolean
  /** `YYYY-MM` */
  analysisYearMonth: string
}

/** `GET /satisfaction-map` (05 §1 #14) — 렌더링 계약은 07 §8 */
export interface SatisfactionMapPoint {
  behaviorId: number
  name: string
  monthlyTotalAmount: number
  avgAmount: number
  txCount: number
  /** 월 합계 ÷ 월 예산 */
  burdenRatio: number
  /** -1 ~ +1 */
  adjustedSatisfaction: number
  retrospectCount: number
  evaluationStatus: EvaluationStatus
  /** 보류(PENDING)면 null */
  quadrant: Quadrant | null
  /** 보류(PENDING)면 null */
  verdict: Verdict | null
  prescription: string
  cta: { type: 'RESERVE_BUDGET'; label: string } | null
}

export interface SatisfactionMap {
  analysisYearMonth: string
  axisX: { label: string; formula: 'MONTHLY_TOTAL_OVER_BUDGET'; monthlyBudget: number }
  axisY: { label: string; range: [number, number] }
  /** 미결 #18 — null이면 축 경계선을 그리지 않는다 */
  boundaries: { x: number | null; y: number | null }
  points: SatisfactionMapPoint[]
}
