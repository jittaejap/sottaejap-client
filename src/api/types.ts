import type { AuthProvider, EvaluationStatus, Quadrant, Verdict } from '@/api/enums'

/** `GET /users/me` (05 §1 #2) */
export interface UserMe {
  id: number
  email: string | null
  nickname: string | null
  authProvider: AuthProvider
  monthlyBudget: number
  outlierThreshold: number
  retrospectDelayDays: number
  onboardingCompleted: boolean
  /** `YYYY-MM` */
  analysisYearMonth: string | null
}

export interface TransactionUploadResult {
  importedCount: number
  skippedCount: number
  periodFrom: string
  periodTo: string
  skippedRows: { row: number; reason: string }[]
}

export interface Goal {
  id: number
  name: string
  targetAmount: number
  currentAmount: number
  adoptedSaving: number
  achievementRate: number
  projectedRate: number
}

export interface RetrospectCandidate {
  transactionId: number
  occurredAt: string
  merchant: string
  amount: number
  category: string
  timeSlot: string
  reasonCode: string
  reason: string
}

export interface Suggestion {
  id: number
  behaviorId: number
  behaviorName: string
  monthlyTotalAmount: number
  avgAmount: number
  txCount: number
  adjustedSatisfaction: number
  quadrant: Quadrant | null
  adjustCount: number
  expectedSaving: number
  goalId: number | null
  status: 'PROPOSED' | 'ADOPTED' | 'REJECTED'
  reason: string
}

export interface Analysis {
  analysisYearMonth: string | null
  byVerdict: {
    verdict: Verdict
    clusterCount: number
    monthlyTotalAmount: number
    share: number | null
  }[]
  pending: { clusterCount: number; monthlyTotalAmount: number; share: number | null }
  byCategory: {
    category: string
    dominantTimeSlot: string | null
    avgAmount: number | null
    monthlyTotalAmount: number
    verdict: Verdict | null
  }[]
  highlight: string
}

export interface NotificationItem {
  id: number
  type: 'RETROSPECT_DUE' | 'SUGGESTION'
  refId: number
  message: string
  isRead: boolean
  createdAt: string
}

export interface MonthlyReport {
  yearMonth: string
  finalized: boolean
  totalSpending: number
  previousTotalSpending: number
  savedAmount: number
  unsatisfiedCount: number
  repeatCount: number
  previousRepeatCount: number
  goalAllocations: { goalId: number; amount: number }[]
}

export interface BehaviorSummary {
  behaviorId: number
  name: string
  clusterKey: string
  parentId: number | null
  monthlyTotalAmount: number
  avgAmount: number
  txCount: number
  retrospectCount: number
  burdenRatio: number
  adjustedSatisfaction: number
  evaluationStatus: EvaluationStatus
  quadrant: Quadrant | null
  verdict: Verdict | null
}

export interface BehaviorTransaction {
  id: number
  occurredAt: string
  merchant: string
  amount: number
  category: string
  timeSlot: string
  behaviorId: number
}

export interface BehaviorDetail {
  behavior: BehaviorSummary
  transactions: BehaviorTransaction[]
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
